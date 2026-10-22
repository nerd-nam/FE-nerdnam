import type { Metadata } from "next";
import { Page, PageHead } from "@/shared/layout/Page";
import { ONBOARDING_STEPS } from "@/shared/steps";
import { Callout } from "@/shared/ui/Callout";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "기술스택 입력" };

// S02 기술스택 입력 (주소: /skills) · 채우는 작업: FE-05
export default function SkillsPage() {
  return (
    <Page width="narrow">
      <Stepper label="온보딩 단계" steps={ONBOARDING_STEPS} current={0} />
      <PageHead
        title="기술스택을 알려주세요"
        desc="공고 문구와 정확히 맞추기 위해 기술명은 표준 이름으로 저장돼요. 예: react.js, 리액트 → React"
      />
      <Callout tone="sunken" icon="info">
        FE-05 에서 만들 예정이에요.
      </Callout>
    </Page>
  );
}
