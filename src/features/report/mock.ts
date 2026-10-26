// S08 에서 쓰는 임시 데이터.
// API(C-03 계약)와 공통 예시 데이터(fixtures/)가 나오면 이 파일 대신 서버에서 받아 온다.
// 내용은 기획서 7.1 과 design/assets/js/report.js 의 예시를 따랐다.
import type { Evidence } from "@/shared/evidence";
import type { Verdict } from "@/shared/ui/Badge";

export type RequirementType = "required" | "preferred";

// 갭 대응 가이드 (ADR-0003). source: AI 가 만들었는지(ai), AI 가 실패해 판정별 기본 문구로 대신했는지(fallback)
export type GapGuide = { advice: string; avoid: string; source: "ai" | "fallback" };

// 요건 하나의 판정 (기획서 4.5 match_results[])
export type MatchResult = {
  id: string;
  type: RequirementType;
  text: string;
  verdict: Verdict;
  reason: string;
  evidence: Evidence[];
  gapGuide?: GapGuide; // 미충족·부분 충족만
};

// 분석 상태 (C-02 S08 조회). 실제로는 작업 상태 조회(폴링)로 받는다 (공통 3번)
export type AnalysisStatus = "done" | "analyzing" | "failed";

// 분석 하나 = 리포트 하나. 공고를 고쳐 다시 분석하면 덮어쓰지 않고 새로 쌓는다 (기획서 v1.25, FE-nerdnam #5)
export type Report = {
  analysisId: string;
  jdId: string;
  company: string;
  position: string;
  analyzedAt: string; // "2026.10.21"
  status: AnalysisStatus;
  diagnosis: string; // 한 줄 진단. API 가 판정 결과로 규칙 생성 (ADR-0003)
  results: MatchResult[];
};

// "분석 기록"에 보여 줄 분석 목록의 한 줄 (C-02 S08 확인할 것 6: 공고의 분석 목록 — 분석 id, 분석일, 상태)
export type AnalysisSummary = Pick<Report, "analysisId" | "analyzedAt" | "status">;

export const VERDICT_LABEL: Record<Verdict, string> = { met: "충족", partial: "부분 충족", unmet: "미충족" };

// S09 임시 데이터도 같은 근거를 쓴다 (features/guide/mock.ts)
export const SKILL_SPRING: Evidence = { kind: "skill", label: "기술 · Spring Boot (능숙)" };
export const CAREER_OO: Evidence = { kind: "career", label: "경력 · OO커머스" };
// 사례 근거는 확정한 프로젝트에만 있다. p_105 는 S05 임시 데이터의 확정 프로젝트 (features/review/mock.ts)
export const EP_PAYMENT: Evidence = { kind: "episode", label: "결제 승인 API 성능 개선", projectId: "p_105", episodeId: "e_501" };
export const EP_BATCH: Evidence = { kind: "episode", label: "정산 배치 쿼리 개선", projectId: "p_103", episodeId: "e_301" };
// 재등록 중인 프로젝트(S06 의 재등록 중 카드)의 이전 확정 사례. 누르면 S06 의 그 카드로 간다
export const EP_NOTIFY: Evidence = { kind: "episode", label: "알림 발송 비동기화", projectId: "p_106", episodeId: "e_601", reregistering: true };

const RESULTS: MatchResult[] = [
  {
    id: "r_1",
    type: "required",
    text: "Java/Spring 기반 개발 경력 3년 이상",
    verdict: "met",
    reason: "Spring Boot를 능숙하게 다루고, Spring을 쓴 경력의 재직기간을 합산하면 3년 이상이에요.",
    evidence: [SKILL_SPRING, CAREER_OO],
  },
  {
    id: "r_2",
    type: "required",
    text: "RDBMS 설계 및 쿼리 튜닝 경험",
    verdict: "met",
    reason: "정산 배치에서 실행 계획 분석과 인덱스 재설계를 했어요.",
    evidence: [EP_BATCH],
  },
  {
    id: "r_3",
    type: "required",
    text: "대용량 트래픽 처리 경험",
    verdict: "met",
    reason: "프로모션 피크 처리량 약 2배를 장애 없이 처리했어요.",
    evidence: [EP_PAYMENT],
  },
  {
    id: "r_4",
    type: "preferred",
    text: "Kafka 등 메시지 큐 운영 경험",
    verdict: "met",
    reason: "승인 후처리를 Kafka 비동기 처리로 분리했어요.",
    evidence: [EP_PAYMENT, EP_NOTIFY],
  },
  {
    id: "r_5",
    type: "preferred",
    text: "결제·금융 도메인 경험",
    verdict: "partial",
    reason: "커머스 결제 시스템 경험은 있지만 금융권 규제 관련 경험은 없어요.",
    evidence: [CAREER_OO, EP_PAYMENT],
    gapGuide: {
      advice: "커머스 결제 경험은 범위를 정확히 밝혀 쓰세요. “결제 승인·정산 시스템 운영”처럼 공고의 주요 업무와 겹치는 표현이 유리해요.",
      avoid: "금융권 경험으로 부풀리기",
      source: "ai",
    },
  },
  {
    id: "r_6",
    type: "preferred",
    text: "Kubernetes 운영 경험",
    verdict: "unmet",
    reason: "저장된 경험에서 관련 근거를 찾지 못했어요.",
    evidence: [],
    // AI 가 실패해 기본 문구로 대신한 예 (ADR-0003 의 미충족 기본 문구). 화면에 "일반 안내" 표시가 붙는다
    gapGuide: {
      advice: "학습 중이거나 개인 프로젝트가 있다면 ‘학습 중’으로 따로 적으세요.",
      avoid: "사용해 본 것처럼 쓰기",
      source: "fallback",
    },
  },
];

const REPORT_J201: Report = {
  analysisId: "fa_2012",
  jdId: "j_201",
  company: "OO페이",
  position: "백엔드 개발자 (결제 플랫폼)",
  analyzedAt: "2026.10.21",
  status: "done",
  diagnosis: "필수 3개 모두 근거 경험이 있어요. 결제 승인 API 개선 경험이 가장 많은 요건(3개)을 뒷받침해요.",
  results: RESULTS,
};

// j_201 의 예전 분석: 공고에 우대사항 "Kubernetes 운영 경험"을 추가하기 전 (이력 보기 확인용)
const REPORT_J201_OLD: Report = {
  ...REPORT_J201,
  analysisId: "fa_2011",
  analyzedAt: "2026.10.20",
  results: RESULTS.filter((r) => r.id !== "r_6"),
};

// 공고 번호별 분석 목록. 맨 앞이 가장 최근 분석이다
// j_202 = 분석 중, j_203 = 분석 실패 (상태 화면 확인용)
// j_204 = S09 탭 상태 화면(만드는 중·실패) 확인용 공고. 리포트 내용은 j_201 과 같다
const MOCK_ANALYSES: Record<string, Report[]> = {
  j_201: [REPORT_J201, REPORT_J201_OLD],
  j_202: [{ analysisId: "fa_2021", jdId: "j_202", company: "△△커머스", position: "서버 개발자", analyzedAt: "", status: "analyzing", diagnosis: "", results: [] }],
  j_203: [{ analysisId: "fa_2031", jdId: "j_203", company: "□□랩", position: "백엔드 엔지니어", analyzedAt: "", status: "failed", diagnosis: "", results: [] }],
  j_204: [{ ...REPORT_J201, analysisId: "fa_2041", jdId: "j_204", company: "◇◇페이먼츠", position: "백엔드 개발자" }],
};

// MOCK_ANALYSES[id] 로 바로 꺼내면 id 가 "constructor" 같은 글자일 때 엉뚱한 값이 나와서 hasOwn 으로 확인한다
function analysesOf(jdId: string): Report[] {
  return Object.hasOwn(MOCK_ANALYSES, jdId) ? MOCK_ANALYSES[jdId] : [];
}

// 리포트 찾기. analysisId 가 없으면 가장 최근 분석 (실제로는 서버 조회 · C-02 S08)
export function findReport(jdId: string, analysisId?: string): Report | undefined {
  const list = analysesOf(jdId);
  return analysisId ? list.find((r) => r.analysisId === analysisId) : list[0];
}

// "분석 기록" 목록 (최근 것이 맨 앞)
export function listAnalyses(jdId: string): AnalysisSummary[] {
  return analysesOf(jdId).map(({ analysisId, analyzedAt, status }) => ({ analysisId, analyzedAt, status }));
}
