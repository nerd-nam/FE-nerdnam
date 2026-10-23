"use client";

// S01 오른쪽 "시작하기" 카드. 움직이는 부분: 개인정보 동의를 체크해야 소셜 버튼을 누를 수 있다.
// - 동의는 처음에 체크되어 있지 않다. 미리 체크된 동의는 사용자가 직접 동의한 것으로 보기 어려워서다
//   (디자인 index.html 은 미리 체크 → FE 결정으로 바꿈, C-02 S01 에 기록)
// - 로그인은 Google·카카오만 (D-8). 이메일 로그인은 MVP 이후
//
// ④ 에서 붙일 것 (C-02 S01):
// - 버튼을 누르면 소셜 로그인 시작 → 로그인 후 돌아올 주소. 지금은 처음 가입한 사용자처럼 S02(/skills)로 바로 간다
// - 로그인 후 갈 화면 판단 (확인할 것 3: 처음 가입 → S02, 온보딩 중 → 하던 단계, 끝남 → S06)
// - 동의 기록 저장 (동의 여부·약관 버전·시각, BE-03)
import { useState } from "react";
import { routes } from "@/shared/routes";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { Checkbox } from "@/shared/ui/Field";
import styles from "./Start.module.css";

const PROVIDERS = [
  { id: "google", label: "Google 계정으로 계속" },
  { id: "kakao", label: "카카오 계정으로 계속" },
] as const;

export function StartCard() {
  const [agreed, setAgreed] = useState(false);

  return (
    // id="start": 머리글의 "로그인" 링크(#start)가 이 카드로 온다
    <Card id="start" size="lg" aria-labelledby="start-title" className={styles.startCard}>
      <div className={styles.startHead}>
        <h2 id="start-title" className={styles.startTitle}>
          시작하기
        </h2>
        <p className={styles.startDesc}>계정을 연결하면 바로 경험 정리를 시작해요.</p>
      </div>

      {/* 동의는 로그인 전에 받는다. 그래서 소셜 버튼보다 위에 둔다 (기획서 v1.25, design/index.html) */}
      <Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} aria-describedby="privacy">
        [필수] 개인정보 수집·이용에 동의합니다. <a href="#privacy">내용 보기</a>
      </Checkbox>
      {/* id="privacy": "내용 보기"와 바닥글 "개인정보 처리방침" 링크가 여기로 온다 (처리방침 화면은 아직 없음, C-02 S01 확인할 것 4) */}
      <Callout tone="muted" id="privacy">
        입력한 이력은 내 계정 안에서만 검색에 쓰여요. 탈퇴하면 원본과 검색용 데이터가 함께 삭제돼요.
      </Callout>

      <div className={styles.providers}>
        {PROVIDERS.map((p) =>
          agreed ? (
            <ButtonLink key={p.id} size="lg" href={routes.skills}>
              {p.label}
            </ButtonLink>
          ) : (
            // 링크(<a>)는 막을 수 없어서, 동의 전에는 눌리지 않는 버튼으로 보여 준다 (S04 재구성 버튼과 같은 방식)
            <Button key={p.id} size="lg" disabled aria-describedby="start-hint">
              {p.label}
            </Button>
          ),
        )}
      </div>
      {!agreed && (
        <p id="start-hint" className={styles.hint}>
          개인정보 수집·이용에 동의하면 시작할 수 있어요.
        </p>
      )}
    </Card>
  );
}
