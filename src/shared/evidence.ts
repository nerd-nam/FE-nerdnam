// 근거: 판정·작성 방향이 어떤 내 경험에서 나왔는지 (S08 근거 링크, S09 근거 출처)
// C-02 S08 조회: 근거 종류 기술·경력·프로젝트·사례, 표시 이름, 원본으로 갈 id
import { routes } from "./routes";

export type Evidence =
  | { kind: "skill" | "career"; label: string }
  | { kind: "episode"; label: string; projectId: string; episodeId: string };

// 근거를 누르면 갈 곳
// - 사례 → S05 읽기 모드에서 그 사례를 펼쳐 연다 (기획서 v1.17)
// - 기술·경력 → 지금은 내 경험(S06)으로 간다 (C-02 S08 확인할 것 2번, FE 제안. S09 는 확인할 것 5번 "S08과 같음")
export function evidenceHref(evidence: Evidence) {
  return evidence.kind === "episode" ? routes.reviewEpisode(evidence.projectId, evidence.episodeId) : routes.library;
}
