// 근거: 판정·작성 방향이 어떤 내 경험에서 나왔는지 (S08 근거 링크, S09 근거 출처)
// C-02 S08 조회: 근거 종류 기술·경력·프로젝트·사례, 표시 이름, 원본으로 갈 id
import { routes } from "./routes";

export type Evidence =
  | { kind: "skill" | "career"; label: string }
  // reregistering: 그 사례의 프로젝트가 재등록 중인지. 서버가 근거 항목에 함께 준다 (FE-nerdnam #4 에서 BE 에 요청)
  | { kind: "episode"; label: string; projectId: string; episodeId: string; reregistering?: boolean };

// 근거를 누르면 갈 곳
// - 사례 → S05 읽기 모드에서 그 사례를 펼쳐 연다 (기획서 v1.17)
// - 사례인데 그 프로젝트가 재등록 중 → S06 의 그 프로젝트 카드 (기획서 v1.25, FE-nerdnam #4)
//   원문을 고치는 중이라 S05 의 원문 하이라이트 위치가 맞지 않아 읽기 모드로 보여 줄 수 없다
// - 기술·경력 → 지금은 내 경험(S06)으로 간다 (C-02 S08 확인할 것 2번, FE 제안. S09 는 확인할 것 5번 "S08과 같음")
export function evidenceHref(evidence: Evidence) {
  if (evidence.kind !== "episode") return routes.library;
  if (evidence.reregistering) return routes.libraryProject(evidence.projectId);
  return routes.reviewEpisode(evidence.projectId, evidence.episodeId);
}
