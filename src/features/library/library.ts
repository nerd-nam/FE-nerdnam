// S06 내 경험: 프로젝트 카드에 쓰는 모양과, 서버 응답(GET /api/me/library 의 LibraryProject, C-03 계약)을 그 모양으로 바꾸는 함수.
import type { components } from "@/shared/api/schema";
import { formatMonth } from "@/features/career/career";

type ApiProject = components["schemas"]["LibraryProject"];

// 프로젝트 상태: 초안 → 검토 중 → 확정 (기획서 4.3), 확정 후 고치는 중이면 재등록 중 (ADR-0002)
export type LibraryProjectStatus = "draft" | "review" | "confirmed" | "reregistering";

export type LibraryEpisode = { id: number; title: string; summary: string }; // summary: "문제 → 해결 → 결과" 한 줄 (서버의 summaryLine)

export type LibraryProject = {
  id: string;
  title: string;
  status: LibraryProjectStatus;
  meta: string; // 소속 · 기간
  skills: string[];
  episodes: LibraryEpisode[]; // 확정한 사례 (재등록 중이면 이전 확정 사례)
};

// 회사 밖 프로젝트의 소속 이름 (S04 소속 선택지와 같은 말)
const AFFILIATION: Record<Exclude<ApiProject["affiliation"], "career">, string> = {
  personal: "개인 프로젝트",
  team: "팀 프로젝트",
};

export function toLibraryProject(p: ApiProject): LibraryProject {
  const affiliation = p.affiliation === "career" ? p.careerCompanyName : AFFILIATION[p.affiliation];
  const period = p.periodStart ? `${formatMonth(p.periodStart)} – ${p.periodEnd ? formatMonth(p.periodEnd) : "현재"}` : null;
  return {
    id: String(p.id),
    title: p.title,
    // 재등록 중이면 서버 상태는 초안·검토 중이지만, 이전 확정 사례가 계속 쓰이므로 "재등록 중" 카드로 보여 준다
    status: p.reregistering ? "reregistering" : p.status,
    meta: [affiliation, period].filter(Boolean).join(" · "),
    skills: p.skills.map((s) => s.name),
    episodes: p.confirmedEpisodes.map((e) => ({ id: e.id, title: e.title, summary: e.summaryLine })),
  };
}
