import type { Metadata } from "next";
import { Page, PageHead } from "@/shared/layout/Page";
import { ONBOARDING_STEPS } from "@/shared/steps";
import { Callout } from "@/shared/ui/Callout";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "프로젝트 재구성 검토" };

// S05 프로젝트 재구성 검토 (주소: /review) · 채우는 작업: FE-08
// 제목·기간은 검토 중인 프로젝트의 값이 들어갈 자리다.
export default function ReviewPage() {
  return (
    <Page tight>
      <Stepper label="온보딩 단계" steps={ONBOARDING_STEPS} current={3} />
      <PageHead title="[프로젝트 제목]" meta="[회사명] · [기간]" />
      <Callout tone="sunken" icon="info">
        FE-08 에서 만들 예정이에요.
      </Callout>
    </Page>
  );
}
