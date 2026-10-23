import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnalysisState } from "@/features/report/AnalysisState";
import { GapGuide } from "@/features/report/GapGuide";
import { AnalysisPicker } from "@/features/report/AnalysisPicker";
import { findReport, listAnalyses, type AnalysisStatus } from "@/features/report/mock";
import { RequirementList } from "@/features/report/RequirementList";
import { ScoreCards } from "@/features/report/ScoreCards";
import styles from "@/features/report/Report.module.css";
import { Page, PageHead } from "@/shared/layout/Page";
import { routes } from "@/shared/routes";
import { APPLY_STEPS } from "@/shared/steps";
import { ButtonLink } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Icon } from "@/shared/ui/Icon";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "적합도 리포트" };

// S08 적합도 리포트 (주소: /apply/[id]/report) · 작업: FE-12 (지금: ① 모양 · ② 나누기 · ③ 움직임(화면 안에서만), ④ 조회 전)
// 데이터는 임시 데이터(features/report/mock.ts): j_201 완료(예전 분석 fa_2011 도 있음), j_202 분석 중, j_203 분석 실패.
// 예전 분석은 ?analysis=분석id 로 연다 (분석 기록, 기획서 v1.25 · FE-nerdnam #5)
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
  done: (analyzedAt) => `${analyzedAt} 분석`,
  analyzing: () => "분석 중",
  failed: () => "분석 실패",
};

function ReportContent({ id, analysisId }: { id: string; analysisId?: string }) {
  // 없는 공고, 이 공고에 없는 분석 번호면 404
  const report = findReport(id, analysisId);
  if (!report) notFound();

  const analyses = listAnalyses(id);
  const isLatest = report.analysisId === analyses[0].analysisId;
  const done = report.status === "done";
  const editJd = <ButtonLink href={routes.jd(id)}>공고 수정</ButtonLink>;

  return (
    <>
      <PageHead
        meta={`${report.company} · ${STATUS_META[report.status](report.analyzedAt)}`}
        title={report.position}
        actions={
          // 분석이 끝나야 작성 방향을 볼 수 있다. 작성 방향은 최신 분석으로 만들므로 예전 분석에서는 숨긴다
          done && isLatest ? (
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

      {analyses.length > 1 && <AnalysisPicker jdId={id} analyses={analyses} currentId={report.analysisId} />}
      {!isLatest && (
        <Callout tone="muted" icon="info">
          {report.analyzedAt} 분석을 보고 있어요. 지금 공고와 다를 수 있고, 작성 방향은 최신 분석으로 만들어요.{" "}
          <Link href={routes.report(id)}>최신 분석 보기</Link>
        </Callout>
      )}

      {report.status === "done" ? (
        <>
          <ScoreCards results={report.results} diagnosis={report.diagnosis} />
          <div className={styles.split}>
            {/* key: 다른 분석으로 바꾸면 판정 필터를 "전체"로 되돌린다 */}
            <RequirementList key={report.analysisId} results={report.results} />
            <GapGuide results={report.results} />
          </div>
        </>
      ) : (
        <AnalysisState initial={report.status} />
      )}
    </>
  );
}
