// 기술스택 공통: 카테고리·숙련도 기준과 화면에서 쓰는 모양 (기획서 4.1, C-03 계약)
import type { components } from "@/shared/api/schema";

// 카테고리 (기획서 4.1). 저장 값은 계약과 같다 (C-02 S02 확인할 것 4)
export const CATEGORIES = [
  { value: "language", label: "언어" },
  { value: "framework", label: "프레임워크" },
  { value: "database", label: "DB" },
  { value: "infra", label: "인프라" },
  { value: "tool", label: "협업 도구" },
] as const satisfies { value: components["schemas"]["SkillResponse"]["category"]; label: string }[];

export type Category = (typeof CATEGORIES)[number]["value"];

export function categoryLabel(value: Category) {
  return CATEGORIES.find((c) => c.value === value)!.label;
}

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

// 표준 사전의 기술 (자동완성·추천 칩)
export type CatalogSkill = { name: string; category: Category };

// 추천 칩은 카테고리 목록의 앞 4개 (C-02 S02 확인할 것 2: 서버는 사전을 거른 목록만 주고, 몇 개 보일지는 웹이 정함)
export const SUGGESTION_COUNT = 4;
