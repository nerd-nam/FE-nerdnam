"use client";

// S01-2 약관 동의 카드 (design/consent.html). 로그인했지만 지금 약관에 동의 기록이 없을 때 나온다.
// 서버는 그때 다른 API 를 403 CONSENT_REQUIRED + termsVersion 으로 막는다 (C-02 S01, C-03).
// 약관 버전이 올라가면 다시 나온다. 처음 동의인지 바뀐 약관인지 서버가 구분해 주지 않아 문구를 하나로 썼다.
// - 동의하고 계속: 체크해야 누를 수 있다 → 동의 기록(POST /api/me/consents) → 하던 화면(next)으로
// - 동의하지 않고 나가기: 로그아웃(POST /api/auth/logout) → S01
// - 탈퇴하기: 확인창 → 탈퇴(DELETE /api/me, 내 데이터 즉시 삭제) → S01
// 서버 요청은 모두 브라우저에서 보낸다. 실패하면 서버가 준 문장을 카드(또는 확인창) 안에 보여 준다.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, resetCsrf } from "@/shared/api/client";
import { problemMessage } from "@/shared/api/problem";
import { routes } from "@/shared/routes";
import { Button } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { Dialog } from "@/shared/ui/Dialog";
import { Checkbox } from "@/shared/ui/Field";
import styles from "./Start.module.css";

type ConsentCardProps = {
  termsVersion: string; // 지금 약관 버전 (403 응답·GET /api/me 의 termsVersion)
  next: string; // 동의한 뒤 돌아갈 화면 (이미 safeNext 로 확인한 주소)
};

export function ConsentCard({ termsVersion, next }: ConsentCardProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [pending, setPending] = useState<"agree" | "leave" | "withdraw" | null>(null); // 서버 답을 기다리는 버튼
  const [error, setError] = useState<string | null>(null); // 동의·나가기 실패 문장
  const [withdrawError, setWithdrawError] = useState<string | null>(null); // 탈퇴 실패 문장 (확인창 안)

  async function agree() {
    setPending("agree");
    setError(null);
    const { error } = await api.POST("/api/me/consents");
    setPending(null);
    if (error) return setError(problemMessage(error, "동의를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
    router.replace(next); // 뒤로 가기로 이 화면에 다시 오지 않게 replace
  }

  async function leave() {
    setPending("leave");
    setError(null);
    const { error } = await api.POST("/api/auth/logout");
    setPending(null);
    if (error) return setError(problemMessage(error, "나가지 못했어요. 잠시 뒤 다시 시도해 주세요."));
    resetCsrf(); // 로그아웃 뒤에는 CSRF 토큰을 새로 받는다 (C-03)
    router.replace(routes.start);
  }

  async function withdraw() {
    setPending("withdraw");
    setWithdrawError(null);
    const { error } = await api.DELETE("/api/me");
    setPending(null);
    if (error) return setWithdrawError(problemMessage(error, "탈퇴하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
    resetCsrf();
    router.replace(routes.start);
  }

  return (
    <Card size="lg" aria-labelledby="consent-title" className={styles.consentCard}>
      <div className={styles.startHead}>
        <h1 id="consent-title" className={styles.consentTitle}>
          약관에 동의해 주세요
        </h1>
        <p className={styles.startDesc}>
          서비스를 계속 쓰려면 지금 약관(버전 <strong className={styles.version}>{termsVersion}</strong>)에 동의해 주세요. 약관이
          바뀌면 다시 동의를 받아요. 동의하기 전에는 내 경험과 지원 준비를 볼 수 없어요.
        </p>
      </div>

      {/* 체크는 직접 해야 한다 (미리 체크하지 않음, C-02 S01 확인할 것 5) */}
      <Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} aria-describedby="consent-privacy">
        [필수] 개인정보 수집·이용과 이용약관에 동의합니다. <a href="#consent-privacy">내용 보기</a>
      </Checkbox>
      <Callout tone="muted" id="consent-privacy">
        입력한 이력은 내 계정 안에서만 검색에 쓰여요. 탈퇴하면 원본과 검색용 데이터가 함께 삭제돼요.
      </Callout>

      {error && (
        <Callout tone="bad" icon="alert" role="alert">
          {error}
        </Callout>
      )}

      <div className={styles.providers}>
        <Button
          variant="primary"
          size="lg"
          disabled={!agreed || pending !== null}
          aria-describedby={agreed ? undefined : "consent-hint"}
          onClick={agree}
        >
          {pending === "agree" ? "저장하는 중…" : "동의하고 계속"}
        </Button>
        <Button size="lg" disabled={pending !== null} onClick={leave}>
          {pending === "leave" ? "나가는 중…" : "동의하지 않고 나가기"}
        </Button>
      </div>
      {!agreed && (
        <p id="consent-hint" className={styles.hint}>
          동의에 체크하면 계속할 수 있어요.
        </p>
      )}

      <p className={styles.withdraw}>
        서비스를 그만 쓰고 싶다면 탈퇴할 수 있어요. 탈퇴하면 입력한 이력과 검색용 데이터가 바로 삭제돼요.{" "}
        <button type="button" className={styles.withdrawBtn} onClick={() => setWithdrawing(true)}>
          탈퇴하기
        </button>
      </p>

      <Dialog
        open={withdrawing}
        onClose={() => {
          setWithdrawing(false);
          setWithdrawError(null);
        }}
        title="탈퇴할까요?"
        actions={
          <>
            <Button
              onClick={() => {
                setWithdrawing(false);
                setWithdrawError(null);
              }}
            >
              취소
            </Button>
            <Button variant="danger" disabled={pending !== null} onClick={withdraw}>
              {pending === "withdraw" ? "탈퇴하는 중…" : "탈퇴"}
            </Button>
          </>
        }
      >
        {withdrawError && (
          <Callout tone="bad" icon="alert" role="alert">
            {withdrawError}
          </Callout>
        )}
        <p>기술스택·경력·프로젝트와 사례, 공고·리포트·작성 방향이 모두 바로 삭제되고 되돌릴 수 없어요.</p>
      </Dialog>
    </Card>
  );
}
