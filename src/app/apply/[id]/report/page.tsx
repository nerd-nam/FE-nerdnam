import type { Metadata } from "next";
import { Page, PageHead } from "@/shared/layout/Page";
import { APPLY_STEPS } from "@/shared/steps";
import { Callout } from "@/shared/ui/Callout";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "적합도 리포트" };

// S08 적합도 리포트 (주소: /apply/[id]/report) · 채우는 작업: FE-12
// 제목·회사명은 공고의 값이 들어갈 자리다.
export default function ReportPage() {
  return (
    <Page>
      <Stepper label="지원 준비 단계" steps={APPLY_STEPS} current={1} />
      <PageHead title="[포지션]" meta="[회사명] · [분석일]" />
      <Callout tone="sunken" icon="info">
        FE-12 에서 만들 예정이에요.
      </Callout>
    </Page>
  );
}
