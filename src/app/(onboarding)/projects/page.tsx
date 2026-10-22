import type { Metadata } from "next";
import { Page, PageHead } from "@/shared/layout/Page";
import { ONBOARDING_STEPS } from "@/shared/steps";
import { Callout } from "@/shared/ui/Callout";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "프로젝트 입력" };

// S04 프로젝트 입력 (주소: /projects) · 채우는 작업: FE-07
export default function ProjectsPage() {
  return (
    <Page>
      <Stepper label="온보딩 단계" steps={ONBOARDING_STEPS} current={2} />
      <PageHead
        title="프로젝트를 편하게 적어 주세요"
        desc="형식은 신경 쓰지 않아도 돼요. AI가 [문제]-[해결]-[결과]로 정리하고, 확정은 직접 확인한 뒤에 해요."
      />
      <Callout tone="sunken" icon="info">
        FE-07 에서 만들 예정이에요.
      </Callout>
    </Page>
  );
}
