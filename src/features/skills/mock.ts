// S02 에서 쓰는 임시 데이터. API(표준 사전 BE-04, 기술스택 BE-06)가 생기면 서버에서 받아 온다.
// 내용은 기획서 4.1 과 design/assets/js/skills.js 를 따랐다.

// 카테고리 (기획서 4.1). 화면 이름과 저장 값의 대응은 C-02 S02 확인할 것 4번
export const CATEGORIES = [
  { value: "language", label: "언어" },
  { value: "framework", label: "프레임워크" },
  { value: "database", label: "DB" },
  { value: "infra", label: "인프라" },
  { value: "tool", label: "협업 도구" },
] as const;

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

export type MySkill = { name: string; category: Category; level: number };

// 표준 사전 (자동완성). aliases 는 다르게 부르는 이름 (예: k8s → Kubernetes)
export type DictionaryEntry = { name: string; category: Category; aliases: string[] };

export const MOCK_DICTIONARY: DictionaryEntry[] = [
  { name: "Java", category: "language", aliases: [] },
  { name: "Kotlin", category: "language", aliases: [] },
  { name: "Python", category: "language", aliases: ["파이썬"] },
  { name: "TypeScript", category: "language", aliases: ["ts", "타입스크립트"] },
  { name: "Spring Boot", category: "framework", aliases: ["spring", "스프링", "springboot"] },
  { name: "Spring Batch", category: "framework", aliases: ["spring"] },
  { name: "Spring Security", category: "framework", aliases: ["spring"] },
  { name: "JPA", category: "framework", aliases: ["hibernate"] },
  { name: "React", category: "framework", aliases: ["react.js", "리액트"] },
  { name: "MySQL", category: "database", aliases: [] },
  { name: "PostgreSQL", category: "database", aliases: ["postgres"] },
  { name: "Redis", category: "database", aliases: ["레디스"] },
  { name: "MongoDB", category: "database", aliases: ["mongo"] },
  { name: "AWS", category: "infra", aliases: ["amazon web services"] },
  { name: "Docker", category: "infra", aliases: ["도커"] },
  { name: "Kubernetes", category: "infra", aliases: ["k8s", "쿠버네티스"] },
  { name: "Kafka", category: "infra", aliases: ["카프카"] },
  { name: "Git", category: "tool", aliases: [] },
  { name: "Jira", category: "tool", aliases: [] },
  { name: "Notion", category: "tool", aliases: ["노션"] },
  { name: "Slack", category: "tool", aliases: [] },
];

// 카테고리별 "자주 쓰는 기술" (디자인은 카테고리마다 4개 고정. 서버가 줄지는 C-02 S02 확인할 것 2번)
export const MOCK_SUGGESTIONS: Record<Category, string[]> = {
  language: ["Java", "Kotlin", "Python", "TypeScript"],
  framework: ["Spring Boot", "Spring Batch", "Spring Security", "JPA"],
  database: ["MySQL", "PostgreSQL", "Redis", "MongoDB"],
  infra: ["AWS", "Docker", "Kubernetes", "Kafka"],
  tool: ["Git", "Jira", "Notion", "Slack"],
};

export const MOCK_MY_SKILLS: MySkill[] = [
  { name: "Java", category: "language", level: 3 },
  { name: "Spring Boot", category: "framework", level: 3 },
  { name: "JPA", category: "framework", level: 3 },
  { name: "MySQL", category: "database", level: 3 },
  { name: "Redis", category: "database", level: 2 },
  { name: "Kafka", category: "infra", level: 2 },
  { name: "AWS", category: "infra", level: 2 },
];
