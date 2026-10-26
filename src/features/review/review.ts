// S05: 화면에서 쓰는 모양과, 서버 응답(GET /api/projects/{id}/review 의 Review, C-03 계약)을 그 모양으로 바꾸는 함수 (기획서 4.3·F2)
import type { components } from "@/shared/api/schema";
import { formatMonth } from "@/features/career/career";

type ApiReview = components["schemas"]["Review"];
type ApiEpisode = components["schemas"]["EpisodeView"];
type ApiVersion = components["schemas"]["VersionView"];

// 사례 상태 (기획서 4.3). superseded(다시 나누기로 대체됨)·discarded(버림)는 화면에 보이지 않아서 뺀다
export type EpisodeStatus = "review" | "confirmed" | "excluded";

export type Metric = { name: string; before: string; after: string; source: string };

// 확인 필요 질문 (서버 clarifications). key 로 답변·빼고 진행을 보낸다
export type Question = { key: string; question: string; example: string };

// 사례의 한 버전 내용 (v1, v2 …)
export type EpisodeVersion = {
  title: string;
  role: string;
  skills: string[];
  problem: string;
  solution: string;
  result: string;
  metrics: Metric[];
  questions: Question[];
  sourceSpans: [number, number][];
};

export type Episode = {
  id: string; // 화면 주소의 #사례번호 (S08 근거 → S05 읽기 모드)
  numId: number; // 서버 번호
  status: EpisodeStatus;
  currentVersion: number;
  versions: Record<number, EpisodeVersion>;
};

// 확인 질문에 답해 원문에 덧붙인 내용 (서버 supplements)
export type Supplement = { id: number; episodeId: number | null; question: string; answer: string };

export type ReviewData = {
  projectId: number;
  projectStatus: "draft" | "review" | "confirmed"; // 확정이면 읽기 모드 (기획서 v1.17). 초안이면 아직 나누지 않음
  reregistering: boolean;
  title: string;
  meta: string; // "OO커머스 · 2024.05 – 2024.09"
  rawText: string;
  // 하이라이트 위치의 기준 글: 원문 + "\n\n" + (질문: …\n답변: …) (BE Project.sourceText). 원문 부분의 위치는 원문과 같다
  sourceText: string;
  supplements: Supplement[];
  episodes: Episode[];
  runningJobId: number | null; // 돌고 있는 AI 작업 (수정 요청·답변 반영·다시 나누기). 있으면 끝날 때까지 기다린다
};

const AFFILIATION = { personal: "개인 프로젝트", team: "팀 프로젝트" } as const;

function toVersion(v: ApiVersion): EpisodeVersion {
  return {
    title: v.title,
    role: v.role ?? "",
    skills: v.skills,
    problem: v.problem ?? "",
    solution: v.solution ?? "",
    result: v.result ?? "",
    metrics: v.metrics.map((m) => ({ name: m.name, before: m.before ?? "", after: m.after ?? "", source: m.source ?? "" })),
    questions: v.clarifications.map((c) => ({ key: c.key, question: c.question, example: c.example ?? "" })),
    sourceSpans: v.sourceSpans.map((s) => [s.start, s.end]),
  };
}

function toEpisode(e: ApiEpisode): Episode {
  return {
    id: String(e.id),
    numId: e.id,
    status: e.status as EpisodeStatus,
    currentVersion: e.currentVersion,
    versions: Object.fromEntries(e.versions.map((v) => [v.versionNo, toVersion(v)])),
  };
}

export function toReviewData(r: ApiReview): ReviewData {
  const affiliation = r.affiliation === "career" ? r.careerCompanyName : AFFILIATION[r.affiliation];
  const period = r.periodStart ? `${formatMonth(r.periodStart)} – ${r.periodEnd ? formatMonth(r.periodEnd) : "현재"}` : null;
  return {
    projectId: r.id,
    projectStatus: r.status,
    reregistering: r.reregistering,
    title: r.title,
    meta: [affiliation, period].filter(Boolean).join(" · "),
    rawText: r.rawText,
    sourceText: r.sourceText,
    supplements: r.supplements.map((s) => ({ id: s.id, episodeId: s.episodeId, question: s.question, answer: s.answer })),
    // 보이는 사례만, 화면 순서대로
    episodes: r.episodes
      .filter((e) => e.status === "review" || e.status === "confirmed" || e.status === "excluded")
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(toEpisode),
    runningJobId: r.runningJobId,
  };
}

// 지금 버전 내용 (서버가 versions 를 빠뜨렸을 때를 대비해 빈 내용)
export function currentOf(ep: Episode): EpisodeVersion {
  return ep.versions[ep.currentVersion] ?? EMPTY_VERSION;
}

const EMPTY_VERSION: EpisodeVersion = { title: "", role: "", skills: [], problem: "", solution: "", result: "", metrics: [], questions: [], sourceSpans: [] };
