// 아직 서버에 연결하지 않은 S06 내 경험이 쓰는 경력 임시 데이터. S03 은 서버(GET /api/me/careers)에서 가져온다(career.ts).
// S06 을 연결하면 이 파일은 지운다. 내용은 기획서 4.2 와 design/career.html 을 따랐다.

// 고용형태 (기획서 4.2)
export const EMPLOYMENT_TYPES = ["정규직", "계약직", "인턴", "프리랜서"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const MAX_DUTIES = 5; // 주요 업무 최대 5줄 (기획서 4.2)

export type Career = {
  id: string;
  company: string;
  team: string; // 부서
  jobTitle: string; // 직무
  position: string; // 직급 (선택)
  employmentType: EmploymentType;
  start: string; // "YYYY-MM"
  end: string | null; // null 이면 재직 중
  duties: string[];
  skills: string[]; // 이 회사에서 쓴 기술 (내 기술스택에서 선택)
};

export const MOCK_CAREERS: Career[] = [
  {
    id: "c_01",
    company: "OO커머스",
    team: "결제플랫폼팀",
    jobTitle: "백엔드 개발자",
    position: "선임",
    employmentType: "정규직",
    start: "2023-03",
    end: null,
    duties: ["결제 승인·취소 API 설계와 운영", "정산 배치 개발과 쿼리 성능 개선"],
    skills: ["Java", "Spring Boot", "JPA", "MySQL", "Redis", "Kafka"],
  },
  {
    id: "c_02",
    company: "[이전 회사명]",
    team: "[부서]",
    jobTitle: "백엔드 개발자",
    position: "",
    employmentType: "정규직",
    start: "2021-01",
    end: "2023-02",
    duties: [],
    skills: ["Java"],
  },
];

export { formatMonth } from "./career";
