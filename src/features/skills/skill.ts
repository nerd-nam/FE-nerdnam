// 기술스택 공통: 숙련도 기준과 화면에서 쓰는 모양 (기획서 4.1, C-03 계약)
import type { components } from "@/shared/api/schema";

// 카테고리는 화면에 보여 주거나 고르게 하지 않고 서버에도 보내지 않는다 (FE 결정 2026-10-27).
// 사전에 있는 기술은 서버가 사전의 카테고리를 쓰고, 사전에 없는 기술은 etc(기타)로 등록한다 (C-03 v0.1.6, nerd-nam/BE-nerdnam#33)

// 숙련도 4단계와 기준 문장 (기획서 4.1)
export const LEVELS = [
  { level: 1, name: "학습 중", desc: "공부했거나 개인 프로젝트에서 써 봤어요" },
  { level: 2, name: "실무 사용", desc: "업무에서 써 봤고, 막히면 찾아보며 해결해요" },
  { level: 3, name: "능숙", desc: "설계부터 문제 해결까지 혼자 할 수 있어요" },
  { level: 4, name: "전문가", desc: "팀의 기준을 정하고 다른 사람을 가르쳐요" },
] as const;

// 내가 추가한 기술. id 는 서버의 내 기술 번호(userSkillId) — 아직 저장하지 않은 새 기술은 없다
export type MySkill = { id?: number; name: string; level: number };

export function toMySkill(s: components["schemas"]["UserSkillResponse"]): MySkill {
  return { id: s.id, name: s.name, level: s.level };
}
