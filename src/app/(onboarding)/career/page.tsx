import type { Metadata } from "next";
import { Page, PageHead } from "@/shared/layout/Page";
import { onboardingSteps } from "@/shared/steps";
import { Callout } from "@/shared/ui/Callout";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "경력 입력" };

// S03 경력 입력 (주소: /career) · 채우는 작업: FE-06
export default function CareerPage() {
  return (
    <Page>
      <Stepper label="온보딩 단계" steps={onboardingSteps()} current={1} />
      <PageHead
        title="경력을 입력해 주세요"
        desc="최근 경력부터 적어 주세요. 공고의 연차 조건은 여기 적은 재직기간으로 계산해요."
      />
      <Callout tone="sunken" icon="info">
        FE-06 에서 만들 예정이에요.
      </Callout>
    </Page>
  );
}
