// S08 에서 쓰는 임시 데이터.
// API(C-03 계약)와 공통 예시 데이터(fixtures/)가 나오면 이 파일 대신 서버에서 받아 온다.
// 내용은 기획서 7.1 과 design/assets/js/report.js 의 예시를 따랐다.
import type { Verdict } from "@/shared/ui/Badge";

export type RequirementType = "required" | "preferred";

// 근거 (C-02 S08 조회: 근거 종류 기술·경력·프로젝트·사례, 표시 이름, 원본으로 갈 id)
// - 사례 근거 → S05 읽기 모드에서 그 사례를 펼쳐 연다 (기획서 v1.17)
// - 기술·경력 근거 → 지금은 내 경험(S06)으로 간다 (C-02 S08 확인할 것 2번, FE 제안)
export type Evidence =
  | { kind: "skill" | "career"; label: string }
  | { kind: "episode"; label: string; projectId: string; episodeId: string };

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

export type Report = {
  jdId: string;
  company: string;
  position: string;
  analyzedAt: string; // "2026.10.21"
  status: AnalysisStatus;
  diagnosis: string; // 한 줄 진단. API 가 판정 결과로 규칙 생성 (ADR-0003)
  results: MatchResult[];
};

export const VERDICT_LABEL: Record<Verdict, string> = { met: "충족", partial: "부분 충족", unmet: "미충족" };

const SKILL_SPRING: Evidence = { kind: "skill", label: "기술 · Spring Boot (능숙)" };
const CAREER_OO: Evidence = { kind: "career", label: "경력 · OO커머스" };
// 사례 근거는 확정한 프로젝트에만 있다. p_105 는 S05 임시 데이터의 확정 프로젝트 (features/review/mock.ts)
const EP_PAYMENT: Evidence = { kind: "episode", label: "결제 승인 API 성능 개선", projectId: "p_105", episodeId: "e_501" };
const EP_BATCH: Evidence = { kind: "episode", label: "정산 배치 쿼리 개선", projectId: "p_103", episodeId: "e_301" };

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
    evidence: [EP_PAYMENT],
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

// 공고 번호별 리포트. j_202 = 분석 중, j_203 = 분석 실패 (상태 화면 확인용)
const MOCK_REPORTS: Record<string, Report> = {
  j_201: {
    jdId: "j_201",
    company: "OO페이",
    position: "백엔드 개발자 (결제 플랫폼)",
    analyzedAt: "2026.10.21",
    status: "done",
    diagnosis: "필수 3개 모두 근거 경험이 있어요. 결제 승인 API 개선 경험이 가장 많은 요건(3개)을 뒷받침해요.",
    results: RESULTS,
  },
  j_202: { jdId: "j_202", company: "△△커머스", position: "서버 개발자", analyzedAt: "", status: "analyzing", diagnosis: "", results: [] },
  j_203: { jdId: "j_203", company: "□□랩", position: "백엔드 엔지니어", analyzedAt: "", status: "failed", diagnosis: "", results: [] },
};

// MOCK_REPORTS[id] 로 바로 꺼내면 id 가 "constructor" 같은 글자일 때 엉뚱한 값이 나와서 hasOwn 으로 확인한다
export function findReport(jdId: string): Report | undefined {
  return Object.hasOwn(MOCK_REPORTS, jdId) ? MOCK_REPORTS[jdId] : undefined;
}
