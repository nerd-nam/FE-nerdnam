"use client";

// S01 오른쪽 "시작하기" 카드. 움직이는 부분: 개인정보 동의를 체크해야 소셜 버튼을 누를 수 있다.
// - 동의는 처음에 체크되어 있지 않다. 미리 체크된 동의는 사용자가 직접 동의한 것으로 보기 어려워서다
//   (디자인 index.html 은 미리 체크 → FE 결정으로 바꿈, C-02 S01 에 기록)
// - 로그인은 Google·카카오만 (D-8). 이메일 로그인은 MVP 이후. 버튼 모양·문구는 각 회사 가이드를 따른다(SocialLoginButton.tsx)
// - 버튼을 누르면 동의를 기억해 두고(loginConsent.ts) 소셜 로그인으로 간다. 돌아오면 S01(app/page.tsx)이 동의를 기록하고 갈 화면으로 보낸다
// - 로그인이 풀려서 왔으면(next) 돌아갈 화면도 적어 둔다(loginReturn.ts)
import { useState } from "react";
import { Callout } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { Checkbox } from "@/shared/ui/Field";
import { rememberLoginConsent } from "./loginConsent";
import { rememberReturnTo } from "./loginReturn";
import { SocialLoginButton, type Provider } from "./SocialLoginButton";
import styles from "./Start.module.css";

const PROVIDERS: Provider[] = ["google", "kakao"];

type StartCardProps = {
  loginFailed?: boolean; // 소셜 로그인이 실패해서 BE 가 /?login=failed 로 돌려보냈을 때
  next?: string; // 로그인이 풀려서 왔을 때(/?next=…) 다시 로그인한 뒤 돌아갈 화면. 이미 우리 사이트 주소인지 확인한 값
};

export function StartCard({ loginFailed = false, next }: StartCardProps) {
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

      {loginFailed ? (
        <Callout tone="bad" icon="alert" role="alert">
          로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.
        </Callout>
      ) : (
        next && (
          <Callout tone="warn" icon="info" role="status">
            로그인이 풀렸어요. 다시 로그인하면 보던 화면으로 돌아가요.
          </Callout>
        )
      )}

      {/* 동의는 로그인 전에 받는다. 그래서 소셜 버튼보다 위에 둔다 (기획서 v1.25, design/index.html) */}
      <Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} aria-describedby="privacy">
        [필수] 개인정보 수집·이용에 동의합니다. <a href="#privacy">내용 보기</a>
      </Checkbox>
      {/* id="privacy": "내용 보기"와 바닥글 "개인정보 처리방침" 링크가 여기로 온다 (처리방침 화면은 아직 없음, C-02 S01 확인할 것 4) */}
      <Callout tone="muted" id="privacy">
        입력한 이력은 내 계정 안에서만 검색에 쓰여요. 탈퇴하면 원본과 검색용 데이터가 함께 삭제돼요.
      </Callout>

      <div className={styles.providers}>
        {PROVIDERS.map((p) => (
          <SocialLoginButton
            key={p}
            provider={p}
            disabled={!agreed}
            describedBy="start-hint"
            onClick={() => {
              rememberLoginConsent();
              rememberReturnTo(next);
            }}
          />
        ))}
      </div>
      {!agreed && (
        <p id="start-hint" className={styles.hint}>
          개인정보 수집·이용에 동의하면 시작할 수 있어요.
        </p>
      )}
    </Card>
  );
}
