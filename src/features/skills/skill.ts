// 기술스택 공통: 숙련도 기준과 화면에서 쓰는 모양 (기획서 4.1, C-03 계약)
import type { components } from "@/shared/api/schema";

// 카테고리는 화면에 보여 주거나 고르게 하지 않는다 (FE 결정 2026-10-27). 서버에 보낼 때만 쓴다
export type Category = components["schemas"]["SkillResponse"]["category"];

// 사전에 없는 기술을 추가할 때 대신 보내는 카테고리. 서버는 사전에 없는 기술에 카테고리를 꼭 받는다.
// 사전에 있는 기술은 서버가 이 값을 쓰지 않고 사전의 카테고리를 쓴다.
// BE 가 '기타(etc)'를 만들고 카테고리를 비워 보내도 되게 바꾸면 이 값을 없앤다 (nerd-nam/BE-nerdnam#33)
export const NEW_SKILL_CATEGORY: Category = "tool";

// 숙련도 4단계와 기준 문장 (기획서 4.1)
export const LEVELS = [
  { level: 1, name: "학습 중", desc: "공부했거나 개인 프로젝트에서 써 봤어요" },
  { level: 2, name: "실무 사용", desc: "업무에서 써 봤고, 막히면 찾아보며 해결해요" },
  { level: 3, name: "능숙", desc: "설계부터 문제 해결까지 혼자 할 수 있어요" },
  { level: 4, name: "전문가", desc: "팀의 기준을 정하고 다른 사람을 가르쳐요" },
] as const;

// 내가 추가한 기술. id 는 서버의 내 기술 번호(userSkillId) — 아직 저장하지 않은 새 기술은 없다
export type MySkill = { id?: number; name: string; category: Category; level: number };

export function toMySkill(s: components["schemas"]["UserSkillResponse"]): MySkill {
  return { id: s.id, name: s.name, category: s.category, level: s.level };
}

// 표준 사전의 기술 (검색 자동완성)
export type CatalogSkill = { name: string; category: Category };
