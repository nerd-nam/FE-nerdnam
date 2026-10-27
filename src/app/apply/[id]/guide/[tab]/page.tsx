import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { effectiveStatus, toGuideContent, toSources } from "@/features/guide/guide";
import { GuideBoard } from "@/features/guide/GuideBoard";
import { GuidePanel } from "@/features/guide/GuidePanel";
import { GuideTabs } from "@/features/guide/GuideTabs";
import { PrintButton } from "@/features/guide/PrintButton";
import { SourcesCard } from "@/features/guide/SourcesCard";
import styles from "@/features/guide/Guide.module.css";
import { data, serverApi } from "@/shared/api/server";
import { Page, PageHead } from "@/shared/layout/Page";
import { GUIDE_TABS, isGuideTab, routes } from "@/shared/routes";
import { APPLY_STEPS } from "@/shared/steps";
import { ButtonLink } from "@/shared/ui/Button";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "작성 방향" };

// S09 작성 방향 (주소: /apply/[id]/guide/[tab]) · 작업: FE-13
// 예: /apply/1/guide/intro → id="1", tab="intro". 탭마다 주소가 있어 새로고침·공유해도 같은 탭이 열린다.
// 화면을 열 때 서버에서 가져온다: 탭 5개 상태(GET /guides), 이 탭 결과(GET /guides/{tab}), 평가(GET /guides/rating),
// 자기소개·경력기술서는 요건 문구를 위해 최신 리포트(GET /report)도. 만들기·기다리기는 브라우저가 한다:
// 이 탭은 GuideBoard, 나머지 탭(화면을 열면 한꺼번에 만들기 시작)과 탭별 상태 표시는 GuideTabs.
// 포트폴리오 페이지 흐름은 FE-14(features/guide/PageFlow), 이미지 프롬프트 탭은 FE-15(features/guide/ImagePanel).
// PDF 내보내기는 브라우저 인쇄 (D-6 결정, features/guide/PrintButton). 지금 보고 있는 탭을 인쇄한다.
//
// params(주소 속 값)는 요청이 들어와야 알 수 있다. 그래서 값을 읽는 부분만 <Suspense> 로 감싸고,
// 나머지(단계 표시)는 미리 만들어 두었다가 바로 보여 준다. (Next.js 16 cacheComponents 규칙)
export default function GuidePage({ params }: PageProps<"/apply/[id]/guide/[tab]">) {
  return (
    <Page tight>
      <Stepper label="지원 준비 단계" steps={APPLY_STEPS} current={2} />
      <Suspense>
        {params.then(({ id, tab }) => (
          <GuideContent id={id} tab={tab} />
        ))}
      </Suspense>
    </Page>
  );
}

async function GuideContent({ id, tab }: { id: string; tab: string }) {
  // 모르는 탭 이름(예: /guide/abc)이나 숫자가 아닌 공고 번호면 404 화면을 보여 준다.
  if (!isGuideTab(tab) || !/^\d+$/.test(id)) notFound();
  const postingId = Number(id);
  const api = await serverApi(routes.guide(id, tab));
  const path = { params: { path: { postingId } } };

  const overview = await api.GET("/api/job-postings/{postingId}/guides", path);
  // 끝난 최신 분석이 없으면(분석 중·실패 422, 분석한 적 없음 404) 리포트(S08)로 보낸다 (FE 결정 2026-10-26).
  // S08 이 분석 중이면 기다리기, 실패면 다시 시도, 분석 전이면 S07, 없는 공고면 404 를 맡는다
  if (overview.response.status === 404 || overview.response.status === 422) redirect(routes.report(id));
  const { companyName, positionName, tabs } = data(overview);
  const status = tabs.find((t) => t.tab === tab) ?? { status: null, generationNo: null, runningJobId: null };

  // 한 번이라도 만들었으면 이 탭의 가장 최근 결과(만드는 중·실패면 내용 없음)
  const needsReport = tab === "intro" || tab === "career";
  const [guide, report, rating] = await Promise.all([
    status.status === null ? null : api.GET("/api/job-postings/{postingId}/guides/{tab}", { params: { path: { postingId, tab } } }).then(data),
    needsReport ? api.GET("/api/job-postings/{postingId}/report", path).then(data) : null,
    // 평가가 없으면 204(내용 없음)
    api.GET("/api/job-postings/{postingId}/guides/rating", path),
  ]);
  const myRating = rating.data ? { score: rating.data.score, comment: rating.data.comment ?? "" } : null;

  const current = GUIDE_TABS.find((item) => item.tab === tab)!;
  // 작업이 돌고 있으면 만드는 중 (effectiveStatus)
  const runningJobId = guide?.runningJobId ?? status.runningJobId;
  const boardStatus = effectiveStatus({ status: guide?.status ?? status.status, runningJobId });
  const done = boardStatus === "completed" && guide !== null;

  return (
    <>
      <PageHead
        meta={`${companyName} · ${positionName}`}
        title="이 공고에 맞춘 작성 방향"
        actions={
          <div className={`${styles.headActions} print-hide`}>
            <ButtonLink href={routes.report(id)}>적합도 리포트</ButtonLink>
            <PrintButton />
          </div>
        }
      />

      {/* 탭 줄은 인쇄하지 않는다 (대신 탭 이름을 제목으로 남긴다 · GuideBoard).
          탭 줄이 아직 안 만든 다른 탭을 모두 만들기 시작하고 탭마다 상태를 보여 준다 (GuideTabs) */}
      <div className="print-hide">
        {/* key: 서버가 준 탭 상태가 바뀌면(탭을 옮기거나 다시 그리기) 새 값으로 다시 시작한다 */}
        <GuideTabs
          key={tabs.map((t) => `${t.tab}-${t.status}-${t.runningJobId}`).join(",")}
          postingId={postingId}
          current={tab}
          initial={tabs}
        />
      </div>

      {/* key: 탭이 바뀌거나 서버가 상태를 바꿔 주면(다시 그리기) 새로 만들어 기다리기·입력한 방향을 새로 시작한다 */}
      <GuideBoard
        key={`${tab}-${guide?.generationNo}-${boardStatus}-${runningJobId}`}
        postingId={postingId}
        tab={tab}
        tabLabel={current.label}
        status={boardStatus}
        runningJobId={runningJobId}
        lastFeedback={guide?.feedback ?? null}
        rating={myRating}
        panel={done && <GuidePanel content={toGuideContent(tab, guide, report?.matches ?? [])} />}
        sources={<SourcesCard sources={done ? toSources(guide) : []} />}
      />
    </>
  );
}
