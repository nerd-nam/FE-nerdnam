// S08 적합도 리포트: 서버 응답(C-03 FitReportView)을 화면에서 쓰기 좋은 모양으로 바꾼다.
import type { components } from "@/shared/api/schema";
import { formatDate } from "@/shared/date";
import type { Evidence } from "@/shared/evidence";
import type { Verdict } from "@/shared/ui/Badge";

type FitReportView = components["schemas"]["FitReportView"];
type EvidenceView = components["schemas"]["EvidenceView"];
export type AnalysisSummary = components["schemas"]["AnalysisSummary"];
// 분석 상태: 분석 중(in_progress) / 완료(completed) / 실패(failed)
export type AnalysisStatus = FitReportView["status"];
export type FailureCode = FitReportView["failureCode"];
// 필수·우대 각각의 충족 수 (서버가 센다)
export type Count = components["schemas"]["Count"];

export type RequirementType = "required" | "preferred";

// 갭 대응 가이드 (ADR-0003). source: AI 가 만들었는지(ai), AI 가 실패해 판정별 기본 문구로 대신했는지(fallback)
export type GapGuide = { advice: string; avoid: string; source: "ai" | "fallback" };

// 요건 하나의 판정 (기획서 4.5 match_results[])
export type MatchResult = {
  id: number;
  type: RequirementType;
  text: string;
  verdict: Verdict;
  reason: string | null;
  evidence: Evidence[];
  gapGuide: GapGuide | null; // 미충족·부분 충족만
};

export type Report = {
  analysisId: number;
  status: AnalysisStatus;
  failureCode: FailureCode;
  company: string;
  position: string;
  analyzedAt: string; // "2026.10.21" (끝난 날, 아직 안 끝났으면 요청한 날)
  required: Count | null; // 완료가 아니면 null
  preferred: Count | null;
  diagnosis: string | null; // 한 줄 진단. API 가 판정 결과로 규칙 생성 (ADR-0003)
  results: MatchResult[]; // 완료가 아니면 빈 배열
  runningJobId: number | null; // 이 공고의 분석이 돌고 있으면 그 작업 번호 (새로고침해도 이어서 기다린다)
};

export const VERDICT_LABEL: Record<Verdict, string> = { met: "충족", partial: "부분 충족", unmet: "미충족" };

export function analyzedAt(a: { completedAt: string | null; requestedAt: string }) {
  return formatDate(a.completedAt ?? a.requestedAt);
}

export function toReport(r: FitReportView): Report {
  return {
    analysisId: r.analysisId,
    status: r.status,
    failureCode: r.failureCode,
    company: r.companyName,
    position: r.positionName,
    analyzedAt: analyzedAt(r),
    required: r.required,
    preferred: r.preferred,
    diagnosis: r.diagnosis,
    results: r.matches.map((m) => ({
      id: m.id,
      type: m.type,
      text: m.text,
      verdict: m.verdict,
      reason: m.reason,
      evidence: m.evidences.map(toEvidence),
      gapGuide: m.gapGuide && { advice: m.gapGuide.advice, avoid: m.gapGuide.avoid, source: m.gapGuide.source },
    })),
    runningJobId: r.runningJobId,
  };
}

// 근거 카드 → 갈 곳을 정할 수 있는 모양 (C-02 S08 확인할 것 2·7, 계약 GET /report 설명)
// S09 "이 방향에 쓰인 근거"(citations)도 같은 모양이라 같이 쓴다 (C-02 S09 확인할 것 5)
// - 지워진 프로젝트·사례(deleted): 이름만 남고 projectId 가 null → 링크 없이 "삭제된 경험"
// - 사례: projectId + sourceId(사례 번호), 프로젝트 요약: projectId. reregistering 이면 S06 카드로 간다
// - 기술·경력: S06
type EvidenceSource = Pick<EvidenceView, "sourceType" | "projectId" | "deleted" | "reregistering" | "label"> & { sourceId: number | null };

export function toEvidence(e: EvidenceSource): Evidence {
  if (e.sourceType === "skill" || e.sourceType === "career") return { kind: e.sourceType, label: e.label };
  if (e.deleted || e.projectId === null) return { kind: "deleted", label: e.label };
  const projectId = String(e.projectId);
  // 사례 번호가 없으면 사례를 펼칠 수 없으니 프로젝트로 보낸다
  if (e.sourceType === "project_summary" || e.sourceId === null) return { kind: "project", label: e.label, projectId, reregistering: e.reregistering };
  return { kind: "episode", label: e.label, projectId, episodeId: String(e.sourceId), reregistering: e.reregistering };
}
