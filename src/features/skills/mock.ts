// 아직 서버에 연결하지 않은 화면(S03 경력의 기술 고르기, S06 내 경험)이 쓰는 내 기술 임시 데이터.
// S02 는 서버(GET /api/me/skills)에서 가져온다. S03·S06 을 연결하면 이 파일은 지운다.
import type { MySkill } from "./skill";

export const MOCK_MY_SKILLS: MySkill[] = [
  { name: "Java", category: "language", level: 3 },
  { name: "Spring Boot", category: "framework", level: 3 },
  { name: "JPA", category: "framework", level: 3 },
  { name: "MySQL", category: "database", level: 3 },
  { name: "Redis", category: "database", level: 2 },
  { name: "Kafka", category: "infra", level: 2 },
  { name: "AWS", category: "infra", level: 2 },
];
