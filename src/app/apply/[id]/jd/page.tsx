import type { Metadata } from "next";
import { Page, PageHead } from "@/shared/layout/Page";
import { APPLY_STEPS } from "@/shared/steps";
import { Callout } from "@/shared/ui/Callout";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "공고 입력" };

// S07 JD 입력 · 채우는 작업: FE-11
// 주소: /apply/new/jd (새 공고) 또는 /apply/17/jd (저장된 17번 공고 수정)
export default function JdPage() {
  return (
    <Page>
      <Stepper label="지원 준비 단계" steps={APPLY_STEPS} current={0} />
      <PageHead title="지원할 공고를 입력해 주세요" desc="공고를 보면서 항목에 맞게 옮겨 적어 주세요." />
      <Callout tone="sunken" icon="info">
        FE-11 에서 만들 예정이에요.
      </Callout>
    </Page>
  );
}
