import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingActions } from "@/features/onboarding/OnboardingActions";
import { MOCK_MY_SKILLS } from "@/features/skills/mock";
import { SkillsBoard } from "@/features/skills/SkillsBoard";
import { skillUsageMap } from "@/features/skills/usage";
import { Page, PageHead } from "@/shared/layout/Page";
import { routes } from "@/shared/routes";
import { onboardingSteps } from "@/shared/steps";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "기술스택 입력" };

// S02 기술스택 입력 (주소: /skills, 검토 중에 오면 /skills?review=p_102) · 작업: FE-05
// 지금: ① 모양 · ② 나누기 · ③ 움직임(화면 안에서만). 저장·자동완성 API(④)는 API 가 생기면 붙인다.
export default function SkillsPage({ searchParams }: PageProps<"/skills">) {
  return (
    <Page width="narrow">
      <Stepper label="온보딩 단계" steps={onboardingSteps()} current={0} />
      <PageHead
        title="기술스택을 알려주세요"
        desc="공고 문구와 정확히 맞추기 위해 기술명은 표준 이름으로 저장돼요. 예: react.js, 리액트 → React"
      />
      <SkillsBoard initialSkills={MOCK_MY_SKILLS} usage={skillUsageMap()} />
      {/* ?review= 는 요청이 들어와야 알 수 있어서 그 값을 쓰는 버튼 줄만 Suspense 로 감싼다 */}
      <Suspense>
        {searchParams.then((sp) => (
          <OnboardingActions
            prev={{ href: routes.start }}
            next={{ href: routes.career, label: "다음: 경력 입력" }}
            reviewId={typeof sp.review === "string" ? sp.review : undefined}
          />
        ))}
      </Suspense>
    </Page>
  );
}
