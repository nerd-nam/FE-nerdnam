import { routes } from "@/shared/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import styles from "./Onboarding.module.css";

type OnboardingActionsProps = {
  prev: { href: string; label?: string };
  next: { href: string; label: string };
  // S05 검토 중에 온 경우(주소 ?review=p_102) 그 프로젝트 id
  reviewId?: string;
};

// S02·S03 아래쪽 이전/다음 버튼.
// S05 검토 중에 왔으면 "다음" 대신 "검토로 돌아가기"를 보여 준다. 원문 화면(S04)을 거치지 않고 돌아가야
// 검토 결과가 유지되기 때문이다 (기획서 v1.14 F2 검토 결과 유지 규칙, D-9)
export function OnboardingActions({ prev, next, reviewId }: OnboardingActionsProps) {
  const keep = (href: string) => (reviewId && (href === routes.skills || href === routes.career) ? `${href}?review=${reviewId}` : href);

  return (
    <div className={styles.actions}>
      <ButtonLink href={keep(prev.href)}>{prev.label ?? "이전"}</ButtonLink>
      {reviewId ? (
        <ButtonLink variant="primary" href={routes.review(reviewId)}>
          <Icon name="arrow" className={styles.flip} />
          검토로 돌아가기
        </ButtonLink>
      ) : (
        <ButtonLink variant="primary" href={next.href}>
          {next.label}
          <Icon name="arrow" />
        </ButtonLink>
      )}
    </div>
  );
}
