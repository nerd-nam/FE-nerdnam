import type { Metadata } from "next";
import { Suspense } from "react";
import { Page, PageHead } from "@/shared/layout/Page";
import { onboardingSteps } from "@/shared/steps";
import { Callout } from "@/shared/ui/Callout";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "프로젝트 재구성 검토" };

// S05 프로젝트 재구성 검토 (주소: /projects/[projectId]/review) · 채우는 작업: FE-08
// 제목·기간은 검토 중인 프로젝트의 값이 들어갈 자리다.
//
// 단계 표시의 "프로젝트 수정" 링크가 지금 프로젝트(/projects/102)로 가야 해서 주소의 번호가 필요하다.
// 번호는 요청이 들어와야 알 수 있으므로 단계 표시만 <Suspense> 로 감싼다. (S09 guide 화면과 같은 방식)
export default function ReviewPage({ params }: PageProps<"/projects/[projectId]/review">) {
  return (
    <Page tight>
      <Suspense>
        {params.then(({ projectId }) => (
          <Stepper label="온보딩 단계" steps={onboardingSteps(projectId)} current={3} />
        ))}
      </Suspense>
      <PageHead title="[프로젝트 제목]" meta="[회사명] · [기간]" />
      <Callout tone="sunken" icon="info">
        FE-08 에서 만들 예정이에요.
      </Callout>
    </Page>
  );
}
