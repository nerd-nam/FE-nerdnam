// 기술이 어디서 쓰이는지 (S02 삭제 안내, ADR-0002 Q7).
// 실제로는 삭제를 누르면 서버가 409(IN_USE)와 함께 사용처 목록을 돌려준다 (C-02 S02 확인할 것 5).
// 지금은 S03 경력·S04 프로젝트 임시 데이터에서 기술 이름으로 찾는다. 화면끼리 임시 데이터가 따로라,
// S03 에서 기술을 빼도 여기에는 반영되지 않는다 (fixtures/·API 가 생기면 맞춰진다).
import { MOCK_CAREERS } from "@/features/career/mock";
import { MOCK_PROJECTS } from "@/features/project/mock";
import { routes } from "@/shared/routes";

export type SkillUsage = { kind: "career" | "project"; label: string; href: string };

export function skillUsageMap(): Record<string, SkillUsage[]> {
  const map: Record<string, SkillUsage[]> = {};
  const push = (name: string, usage: SkillUsage) => (map[name] ??= []).push(usage);
  for (const c of MOCK_CAREERS) {
    // 경력 화면은 주소로 특정 경력을 열 수 없어서 S03 로 보낸다
    for (const name of c.skills) push(name, { kind: "career", label: `${c.company} 경력`, href: routes.career });
  }
  for (const p of MOCK_PROJECTS) {
    for (const name of p.skills) push(name, { kind: "project", label: `${p.title} 프로젝트`, href: routes.project(p.id) });
  }
  return map;
}
