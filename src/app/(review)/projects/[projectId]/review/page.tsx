import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { toReviewData } from "@/features/review/review";
import { ReviewBoard } from "@/features/review/ReviewBoard";
import { data, serverApi } from "@/shared/api/server";
import { dataKey } from "@/shared/dataKey";
import { Header } from "@/shared/layout/Header";
import { Page } from "@/shared/layout/Page";
import { routes } from "@/shared/routes";
import { onboardingSteps } from "@/shared/steps";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "프로젝트 재구성 검토" };

// S05 프로젝트 재구성 검토 (주소: /projects/[projectId]/review) · 작업: FE-08 (① 모양 · ② 나누기 · ③ 움직임 · ④ 서버 연결)
// 화면을 열 때 필요한 것(검토 화면 = 원문·사례·버전, 내가 남긴 사례 생성 평가)은 서버에서 가져온다.
// 버튼마다의 저장·AI 요청은 브라우저에서 보낸다 (ReviewBoard). 확정한 프로젝트는 같은 주소에서 읽기 모드 (기획서 v1.17).
//
// 머리글: 이 화면만 (onboarding) 그룹 밖의 (review) 그룹에 둔다. 주소는 그대로다(괄호 폴더는 주소에 안 나타남).
//   레이아웃은 프로젝트가 확정인지 모르므로, 화면이 데이터를 보고 직접 고른다.
//   검토 중 → 온보딩 머리글("저장하고 나중에 하기") / 확정(읽기 모드) → 앱 머리글("내 경험" 메뉴)
//
// 머리글·단계 표시·화면 내용 모두 서버 데이터가 필요해서 함께 <Suspense> 로 감싼다.
export default function ReviewPage({ params }: PageProps<"/projects/[projectId]/review">) {
  return (
    <Suspense>
      {params.then(({ projectId }) => (
        <ReviewContent projectId={projectId} />
      ))}
    </Suspense>
  );
}

async function ReviewContent({ projectId }: { projectId: string }) {
  const id = Number(projectId);
  if (!Number.isInteger(id)) notFound();
  const api = await serverApi(routes.review(projectId));
  const [review, rating] = await Promise.all([
    api.GET("/api/projects/{projectId}/review", { params: { path: { projectId: id } } }),
    api.GET("/api/projects/{projectId}/rating", { params: { path: { projectId: id } } }),
  ]);
  const initial = toReviewData(data(review)); // 없는 번호·남의 프로젝트면 404 화면

  // 아직 나누지 않은 초안이면 검토할 것이 없다 → 원문 화면(S04). 나누는 중이면(runningJobId) 여기서 이어서 기다린다
  if (initial.projectStatus === "draft" && initial.runningJobId === null) redirect(routes.project(projectId));

  const readOnly = initial.projectStatus === "confirmed";
  // 평가가 없으면 204(본문 없음)
  const myRating = rating.data ? { score: rating.data.score, comment: rating.data.comment ?? "" } : null;

  return (
    <>
      {readOnly ? <Header variant="app" area="library" /> : <Header variant="onboarding" />}
      <Page tight>
        {!readOnly && <Stepper label="온보딩 단계" steps={onboardingSteps(projectId)} current={3} />}
        {/* key: 다시 왔을 때 서버의 검토 화면·평가가 바뀌었으면(AI 작업이 끝남 등) 새 값으로 다시 시작한다 (shared/dataKey) */}
        <ReviewBoard key={dataKey([initial, myRating])} initial={initial} rating={myRating} />
      </Page>
    </>
  );
}
