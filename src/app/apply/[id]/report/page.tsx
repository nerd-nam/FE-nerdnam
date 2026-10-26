import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AnalysisState } from "@/features/report/AnalysisState";
import { GapGuide } from "@/features/report/GapGuide";
import { AnalysisPicker } from "@/features/report/AnalysisPicker";
import { toReport, type AnalysisStatus } from "@/features/report/report";
import { RequirementList } from "@/features/report/RequirementList";
import { ScoreCards } from "@/features/report/ScoreCards";
import styles from "@/features/report/Report.module.css";
import { data, serverApi } from "@/shared/api/server";
import { Page, PageHead } from "@/shared/layout/Page";
import { routes } from "@/shared/routes";
import { APPLY_STEPS } from "@/shared/steps";
import { ButtonLink } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Icon } from "@/shared/ui/Icon";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "적합도 리포트" };

// S08 적합도 리포트 (주소: /apply/[id]/report) · 작업: FE-12
// 화면을 열 때 서버에서 가져온다: 분석 기록(GET /analyses) + 최신 리포트(GET /report) 또는 고른 분석(GET /fit-analyses/{id}).
// 예전 분석은 ?analysis=분석번호 로 연다 (분석 기록, 기획서 v1.25 · FE-nerdnam #5)
export default function ReportPage({ params, searchParams }: PageProps<"/apply/[id]/report">) {
  return (
    <Page>
      <Stepper label="지원 준비 단계" steps={APPLY_STEPS} current={1} />
      {/* 주소의 공고 번호·분석 번호가 필요한 부분만 Suspense 로 감싼다 (Next.js 16 cacheComponents 규칙) */}
      <Suspense>
        {Promise.all([params, searchParams]).then(([{ id }, sp]) => (
          <ReportContent id={id} analysisId={typeof sp.analysis === "string" ? sp.analysis : undefined} />
        ))}
      </Suspense>
    </Page>
  );
}

// 제목 위 작은 글씨: "OO페이 · 2026.10.21 분석"
const STATUS_META: Record<AnalysisStatus, (analyzedAt: string) => string> = {
  completed: (analyzedAt) => `${analyzedAt} 분석`,
  in_progress: () => "분석 중",
  failed: () => "분석 실패",
};

const isNumber = (value: string) => /^\d+$/.test(value);

async function ReportContent({ id, analysisId }: { id: string; analysisId?: string }) {
  // 공고·분석 번호는 숫자다. "new" 나 글자면 404
  if (!isNumber(id) || (analysisId !== undefined && !isNumber(analysisId))) notFound();
  const postingId = Number(id);
  const api = await serverApi(routes.report(id, analysisId));

  // 분석 기록 (최신순). 없는 공고·남의 공고면 404
  const analyses = data(await api.GET("/api/job-postings/{postingId}/analyses", { params: { path: { postingId } } }));
  // 아직 한 번도 분석하지 않은 공고 → 공고 입력(S07)에서 "적합도 분석하기"를 누르게 한다 (FE 결정 2026-10-26)
  if (analyses.length === 0) redirect(routes.jd(id));

  const report = toReport(
    data(
      analysisId === undefined
        ? await api.GET("/api/job-postings/{postingId}/report", { params: { path: { postingId } } })
        : await api.GET("/api/fit-analyses/{analysisId}", { params: { path: { analysisId: Number(analysisId) } } }),
    ),
  );
  // 이 공고의 분석이 아니면 404 (다른 공고의 분석 번호를 주소에 넣은 경우)
  if (!analyses.some((a) => a.analysisId === report.analysisId)) notFound();

  const isLatest = report.analysisId === analyses[0].analysisId;
  const editJd = <ButtonLink href={routes.jd(id)}>공고 수정</ButtonLink>;

  return (
    <>
      <PageHead
        meta={`${report.company} · ${STATUS_META[report.status](report.analyzedAt)}`}
        title={report.position}
        actions={
          // 분석이 끝나야 작성 방향을 볼 수 있다. 작성 방향은 최신 분석으로 만들므로 예전 분석에서는 숨긴다
          report.status === "completed" && isLatest ? (
            <div className={styles.headActions}>
              {editJd}
              <ButtonLink variant="primary" href={routes.guide(id, "motive")}>
                작성 방향 보기 <Icon name="arrow" />
              </ButtonLink>
            </div>
          ) : (
            editJd
          )
        }
      />

      {analyses.length > 1 && <AnalysisPicker postingId={id} analyses={analyses} currentId={report.analysisId} />}
      {!isLatest && (
        <Callout tone="muted" icon="info">
          {report.analyzedAt} 분석을 보고 있어요. 지금 공고와 다를 수 있고, 작성 방향은 최신 분석으로 만들어요.{" "}
          <Link href={routes.report(id)}>최신 분석 보기</Link>
        </Callout>
      )}

      {report.status === "completed" && report.required && report.preferred ? (
        <>
          <ScoreCards results={report.results} required={report.required} preferred={report.preferred} diagnosis={report.diagnosis ?? ""} />
          <div className={styles.split}>
            {/* key: 다른 분석으로 바꾸면 판정 필터를 "전체"로 되돌린다 */}
            <RequirementList key={report.analysisId} results={report.results} />
            <GapGuide results={report.results} />
          </div>
        </>
      ) : (
        <AnalysisState
          // 서버가 상태를 바꿔 주면(다시 그리기) 새로 만들어 기다리기를 다시 시작한다
          key={`${report.analysisId}-${report.status}-${report.runningJobId}`}
          postingId={postingId}
          analysisId={report.analysisId}
          // 완료인데 집계가 없으면(계약상 없는 경우) 아직 저장 중인 것으로 보고 다시 묻는다
          status={report.status === "completed" ? "in_progress" : report.status}
          failureCode={report.failureCode}
          runningJobId={report.runningJobId}
          canRetry={isLatest}
        />
      )}
    </>
  );
}
