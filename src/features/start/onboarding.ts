// 로그인 후 보낼 화면 (C-02 S01 확인할 것 3): 처음 가입 → S02, 온보딩 중 → 하던 단계, 끝남 → S06.
// 서버가 GET /api/me/onboarding 의 nextStep 으로 단계를 알려 준다: skills → career → project → library (BE LibraryController)
import type { components } from "@/shared/api/schema";
import { NEW_PROJECT_ID, routes } from "@/shared/routes";

type Onboarding = components["schemas"]["Onboarding"];

export function nextStepPath({ nextStep, reviewingProjectId }: Onboarding) {
  switch (nextStep) {
    case "skills":
      return routes.skills;
    case "career":
      return routes.career;
    case "project":
      // 검토 중인 프로젝트가 있으면 그 검토(S05)로, 없으면 새 프로젝트(S04) (FE 결정 2026-10-26)
      return reviewingProjectId !== null ? routes.review(String(reviewingProjectId)) : routes.project(NEW_PROJECT_ID);
    default:
      // "library" 와 모르는 값은 내 경험(S06)
      return routes.library;
  }
}
