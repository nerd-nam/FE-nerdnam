import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MOCK_REVIEW } from "@/features/review/mock";
import { RawTextPanel } from "@/features/review/RawTextPanel";
import { ReviewBoard } from "@/features/review/ReviewBoard";
import { Page } from "@/shared/layout/Page";
import { onboardingSteps } from "@/shared/steps";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "프로젝트 재구성 검토" };

// S05 프로젝트 재구성 검토 (주소: /projects/[projectId]/review) · 작업: FE-08
// 지금: ① 모양 · ② 나누기 · ③ 움직임(화면 안에서만). 서버 저장·AI 요청(④)은 API 가 생기면 붙인다.
// 데이터는 임시 데이터(features/review/mock.ts)이고, 지금은 p_102 만 있다.
//
// 단계 표시의 "프로젝트 수정" 링크와 화면 내용 모두 주소의 프로젝트 번호가 필요해서 함께 <Suspense> 로 감싼다.
export default function ReviewPage({ params }: PageProps<"/projects/[projectId]/review">) {
  return (
    <Page tight>
      <Suspense>
        {params.then(({ projectId }) => (
          <ReviewContent projectId={projectId} />
        ))}
      </Suspense>
    </Page>
  );
}

function ReviewContent({ projectId }: { projectId: string }) {
  // 임시 데이터에 없는 프로젝트(아직 나누지 않은 프로젝트 포함)는 404
  if (projectId !== MOCK_REVIEW.projectId) notFound();
  const data = MOCK_REVIEW;

  return (
    <>
      <Stepper label="온보딩 단계" steps={onboardingSteps(projectId)} current={3} />
      {/* RawTextPanel 은 서버 컴포넌트. 클라이언트 컴포넌트인 ReviewBoard 에 "이 자리에 놓아 줘"라고 건네준다 */}
      <ReviewBoard data={data} rawPanel={<RawTextPanel data={data} />} />
    </>
  );
}
