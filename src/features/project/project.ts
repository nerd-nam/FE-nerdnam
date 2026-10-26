// S04 프로젝트: 양식에서 쓰는 모양과 서버(C-03 계약 Detail·DraftRequest) 사이 변환 (기획서 4.3·F1)
import type { components } from "@/shared/api/schema";

type Detail = components["schemas"]["Detail"];
type DraftRequest = components["schemas"]["DraftRequest"];

export type ProjectStatus = Detail["status"]; // 초안(draft) → 검토 중(review) → 확정(confirmed)

// 소속 선택 값: 경력이면 "career:경력번호", 회사 밖이면 "personal"(개인)·"team"(팀), 아직 안 골랐으면 "" (C-02 S04 확인할 것 3)
export type AffiliationValue = `career:${number}` | "personal" | "team" | "";

export type ProjectDraft = {
  id: number | null; // 서버 번호. 새 프로젝트(/projects/new)는 처음 저장하기 전까지 null
  version: number | null; // 서버가 준 수정 번호. 그사이 다른 곳에서 고쳤으면 저장 때 409
  title: string;
  start: string; // "YYYY-MM" (비워 둘 수 있음)
  end: string;
  affiliation: AffiliationValue;
  skillIds: number[]; // 이 프로젝트에서 쓴 기술 = 내 기술스택 번호(userSkillId)
  rawText: string;
  repoUrl: string; // GitHub 링크 (선택)
  demoUrl: string; // 배포·문서 링크 (선택)
};

export const EMPTY_DRAFT: ProjectDraft = {
  id: null,
  version: null,
  title: "",
  start: "",
  end: "",
  affiliation: "",
  skillIds: [],
  rawText: "",
  repoUrl: "",
  demoUrl: "",
};

// 링크는 서버에 목록 하나(links)로 저장한다 (확인할 것 4). 화면 두 칸으로 나눌 때 github 주소를 GitHub 칸에 둔다
const isRepo = (url: string) => /github\.com/i.test(url);

export function toDraft(d: Detail): ProjectDraft {
  const repoUrl = d.links.find(isRepo) ?? "";
  return {
    id: d.id,
    version: d.version,
    title: d.title,
    start: d.periodStart ?? "",
    end: d.periodEnd ?? "",
    affiliation: d.affiliation === "career" ? (d.careerId !== null ? `career:${d.careerId}` : "") : d.affiliation,
    skillIds: d.skills.map((s) => s.userSkillId),
    rawText: d.rawText,
    repoUrl,
    demoUrl: d.links.find((l) => l !== repoUrl) ?? "",
  };
}

export function toRequest(p: ProjectDraft): DraftRequest {
  const career = p.affiliation.startsWith("career:");
  const outside = p.affiliation === "personal" || p.affiliation === "team" ? p.affiliation : null;
  return {
    title: p.title.trim(),
    periodStart: p.start || null,
    periodEnd: p.end || null,
    affiliation: career ? "career" : outside,
    careerId: career ? Number(p.affiliation.slice("career:".length)) : null,
    userSkillIds: p.skillIds,
    rawText: p.rawText,
    links: [p.repoUrl.trim(), p.demoUrl.trim()].filter(Boolean),
    version: p.version,
  };
}

// 저장한 것과 양식이 같은지 (저장할 것이 있는지 볼 때)
export function sameDraft(a: ProjectDraft, b: ProjectDraft) {
  const norm = (p: ProjectDraft) => ({ ...toRequest(p), userSkillIds: [...p.skillIds].sort((x, y) => x - y) });
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
}
