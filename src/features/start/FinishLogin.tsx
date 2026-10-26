"use client";

// S01 로그인 마무리: 소셜 로그인은 끝났는데 지금 약관에 동의 기록이 없을 때(GET /api/me 의 consentRequired) 나온다.
// - S01 에서 동의하고 로그인 버튼을 눌렀으면(loginConsent.ts) 동의를 기록한다(POST /api/me/consents).
//   그다음 S01 을 다시 그리면 서버가 갈 화면(onboarding.ts)으로 보낸다.
// - 동의를 기억하지 못했으면(약관 버전이 올라간 기존 사용자, 다른 탭에서 로그인 등) 약관 동의 화면(S01-2)으로.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/shared/api/client";
import { problemMessage } from "@/shared/api/problem";
import { routes } from "@/shared/routes";
import { Button } from "@/shared/ui/Button";
import { StateCard, StateText } from "@/shared/ui/StateCard";
import { takeLoginConsent } from "./loginConsent";

// 동의를 기록하고, 실패하면 화면에 띄울 문장을 돌려준다 (성공이면 null)
async function postConsent() {
  const { error } = await api.POST("/api/me/consents");
  return error ? problemMessage(error, "동의를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.") : null;
}

export function FinishLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // 개발 모드에서 React 가 화면을 두 번 그려 보는데, 그때 동의를 두 번 꺼내지 않게 한 번만 돈다
  const started = useRef(false);

  function recordConsent() {
    postConsent().then((message) => {
      if (message) setError(message);
      else router.refresh(); // S01 을 서버에서 다시 그리면 갈 화면으로 보낸다
    });
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (takeLoginConsent()) recordConsent();
    else router.replace(routes.consent(routes.start));
    // 처음 한 번만 돈다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <StateCard tone="bad" title="로그인을 마치지 못했어요">
        <StateText>{error}</StateText>
        <Button
          onClick={() => {
            setError(null);
            recordConsent();
          }}
        >
          다시 시도
        </Button>
      </StateCard>
    );
  }
  return (
    <StateCard tone="wait" title="로그인하는 중이에요">
      <StateText>잠시만 기다려 주세요.</StateText>
    </StateCard>
  );
}
