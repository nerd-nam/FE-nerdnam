"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { routes } from "@/shared/routes";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import styles from "./Onboarding.module.css";

type OnboardingActionsProps = {
  prev: { href: string; label?: string };
  next: { href: string; label: string };
  // S05 검토 중에 온 경우(주소 ?review=p_102) 그 프로젝트 id
  reviewId?: string;
  // 이동하기 전에 저장할 것이 있는 화면(S02: 바꾼 것을 "다음"에서 한 번에 저장)은 저장 함수를 넘긴다.
  // 성공하면 true → 이동, 실패하면 false → 화면이 오류를 보여 주고 머문다
  save?: () => Promise<boolean>;
};

// S02·S03 아래쪽 이전/다음 버튼.
// S05 검토 중에 왔으면 "다음" 대신 "검토로 돌아가기"를 보여 준다. 원문 화면(S04)을 거치지 않고 돌아가야
// 검토 결과가 유지되기 때문이다 (기획서 v1.14 F2 검토 결과 유지 규칙, D-9)
export function OnboardingActions({ prev, next, reviewId, save }: OnboardingActionsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const keep = (href: string) => (reviewId && (href === routes.skills || href === routes.career) ? `${href}?review=${reviewId}` : href);

  const prevHref = keep(prev.href);
  const nextHref = reviewId ? routes.review(reviewId) : next.href;
  const nextLabel = reviewId ? (
    <>
      <Icon name="arrow" className={styles.flip} />
      검토로 돌아가기
    </>
  ) : (
    <>
      {next.label}
      <Icon name="arrow" />
    </>
  );

  // 저장할 것이 없는 화면은 보통 링크
  if (!save) {
    return (
      <div className={styles.actions}>
        <ButtonLink href={prevHref}>{prev.label ?? "이전"}</ButtonLink>
        <ButtonLink variant="primary" href={nextHref}>
          {nextLabel}
        </ButtonLink>
      </div>
    );
  }

  async function saveAndGo(href: string) {
    setSaving(true);
    const ok = await save!();
    setSaving(false);
    if (ok) router.push(href);
  }

  return (
    <div className={styles.actions}>
      <Button disabled={saving} onClick={() => saveAndGo(prevHref)}>
        {prev.label ?? "이전"}
      </Button>
      <Button variant="primary" disabled={saving} onClick={() => saveAndGo(nextHref)}>
        {saving ? "저장하는 중…" : nextLabel}
      </Button>
    </div>
  );
}
