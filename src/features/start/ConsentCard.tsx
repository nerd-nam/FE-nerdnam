"use client";

// S01-2 약관 동의 카드 (design/consent.html). 로그인했지만 지금 약관에 동의 기록이 없을 때 나온다.
// 서버는 그때 다른 API 를 403 CONSENT_REQUIRED + termsVersion 으로 막는다 (C-02 S01, C-03).
// 약관 버전이 올라가면 다시 나온다. 처음 동의인지 바뀐 약관인지 서버가 구분해 주지 않아 문구를 하나로 썼다.
// - 동의하고 계속: 체크해야 누를 수 있다 → 하던 화면(next)으로
// - 동의하지 않고 나가기: 로그아웃 → S01
// - 탈퇴하기: 확인창 → 탈퇴(내 데이터 즉시 삭제) → S01
// ④ 에서 붙일 것: POST /api/me/consents, POST /api/auth/logout, DELETE /api/me. 지금은 이동만 한다.
import { useRouter } from "next/navigation";
import { useState } from "react";
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

      <div className={styles.providers}>
        <Button
          variant="primary"
          size="lg"
          disabled={!agreed}
          aria-describedby={agreed ? undefined : "consent-hint"}
          // TODO(④): POST /api/me/consents 뒤 이동
          onClick={() => router.push(next)}
        >
          동의하고 계속
        </Button>
        {/* TODO(④): POST /api/auth/logout 뒤 이동 */}
        <Button size="lg" onClick={() => router.push(routes.start)}>
          동의하지 않고 나가기
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
        onClose={() => setWithdrawing(false)}
        title="탈퇴할까요?"
        actions={
          <>
            <Button onClick={() => setWithdrawing(false)}>취소</Button>
            {/* TODO(④): DELETE /api/me 뒤 이동 */}
            <Button variant="danger" onClick={() => router.push(routes.start)}>
              탈퇴
            </Button>
          </>
        }
      >
        <p>기술스택·경력·프로젝트와 사례, 공고·리포트·작성 방향이 모두 바로 삭제되고 되돌릴 수 없어요.</p>
      </Dialog>
    </Card>
  );
}
