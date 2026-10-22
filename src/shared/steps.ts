import type { Step } from "@/shared/ui/Stepper";
import { routes } from "@/shared/routes";

// 온보딩 단계 (S02~S05). 지난 단계는 "수정" 링크로 돌아갈 수 있다 (기획서 F1).
// "프로젝트" 단계로 돌아가려면 어느 프로젝트인지 알아야 해서, S05 에서는 지금 검토 중인 프로젝트 번호를 넘긴다.
// S02~S04 에서는 프로젝트 단계가 아직 지나지 않아 링크가 쓰이지 않으므로 번호 없이 부른다.
export function onboardingSteps(projectId?: string): Step[] {
  return [
    { label: "기술스택", href: routes.skills },
    { label: "경력", href: routes.career },
    { label: "프로젝트", href: projectId ? routes.project(projectId) : undefined },
    { label: "검토·확정" },
  ];
}

// 지원 준비 단계 (S07~S09). 디자인에서는 지난 단계가 링크가 아니다.
export const APPLY_STEPS: Step[] = [{ label: "공고 입력" }, { label: "적합도 리포트" }, { label: "작성 방향" }];
