import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { findReview } from "@/features/review/mock";
import { RawTextPanel } from "@/features/review/RawTextPanel";
import { ReviewBoard } from "@/features/review/ReviewBoard";
import { Header } from "@/shared/layout/Header";
import { Page } from "@/shared/layout/Page";
import { onboardingSteps } from "@/shared/steps";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "프로젝트 재구성 검토" };

// S05 프로젝트 재구성 검토 (주소: /projects/[projectId]/review) · 작업: FE-08
// 지금: ① 모양 · ② 나누기 · ③ 움직임(화면 안에서만). 서버 저장·AI 요청(④)은 API 가 생기면 붙인다.
// 데이터는 임시 데이터(features/review/mock.ts): p_102 검토 중, p_103 확정(읽기 모드, 기획서 v1.17).
//
// 머리글: 이 화면만 (onboarding) 그룹 밖의 (review) 그룹에 둔다. 주소는 그대로다(괄호 폴더는 주소에 안 나타남).
//   레이아웃은 프로젝트가 확정인지 모르므로, 화면이 데이터를 보고 직접 고른다.
//   검토 중 → 온보딩 머리글("저장하고 나중에 하기") / 확정(읽기 모드) → 앱 머리글("내 경험" 메뉴)
//
// 머리글·단계 표시·화면 내용 모두 주소의 프로젝트 번호가 필요해서 함께 <Suspense> 로 감싼다.
export default function ReviewPage({ params }: PageProps<"/projects/[projectId]/review">) {
  return (
    <Suspense>
      {params.then(({ projectId }) => (
        <ReviewContent projectId={projectId} />
      ))}
    </Suspense>
  );
}

function ReviewContent({ projectId }: { projectId: string }) {
  // 임시 데이터에 없는 프로젝트(아직 나누지 않은 프로젝트 포함)는 404
  const found = findReview(projectId);
  if (!found) notFound();

  // 읽기 모드는 확정한 사례만 보여 주고(원문 하이라이트 포함), 온보딩 단계 표시도 필요 없다
  const readOnly = found.projectStatus === "confirmed";
  const data = readOnly ? { ...found, episodes: found.episodes.filter((ep) => ep.status === "confirmed") } : found;

  return (
    <>
      {readOnly ? <Header variant="app" area="library" /> : <Header variant="onboarding" />}
      <Page tight>
        {!readOnly && <Stepper label="온보딩 단계" steps={onboardingSteps(projectId)} current={3} />}
        {/* RawTextPanel 은 서버 컴포넌트. 클라이언트 컴포넌트인 ReviewBoard 에 "이 자리에 놓아 줘"라고 건네준다 */}
        <ReviewBoard data={data} rawPanel={<RawTextPanel data={data} />} />
      </Page>
    </>
  );
}
