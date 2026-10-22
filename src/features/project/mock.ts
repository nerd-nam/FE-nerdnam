// S04 에서 쓰는 임시 데이터.
// API(C-03 계약)와 공통 예시 데이터(fixtures/)가 나오면 이 파일 대신 서버에서 받아 온다.
// 내용은 기획서 4.3·7장 예시와 design/project.html 을 따랐다.

// 프로젝트 상태 (기획서 4.3): 초안 → 검토 중 → 확정
export type ProjectStatus = "draft" | "review" | "confirmed";

export type Project = {
  id: string;
  title: string;
  period: { start: string; end: string }; // "YYYY-MM"
  // 소속: 경력 id, 또는 회사 밖 프로젝트면 "personal"(개인)·"team"(팀). 실제 값 이름은 C-02 S04 확인할 것 3번에서 정한다
  affiliation: string;
  skills: string[]; // 기술 이름. API 가 생기면 기술 id 로 바뀔 수 있다
  rawText: string; // 사용자가 쓴 본문 원문
  repoUrl: string;
  demoUrl: string;
  status: ProjectStatus;
};

export type Option = { value: string; label: string };

// 소속 선택지: 내 경력(S03 데이터) + 회사 밖 프로젝트 2가지
export const MOCK_AFFILIATIONS: Option[] = [
  { value: "c_01", label: "OO커머스 · 결제플랫폼팀" },
  { value: "c_02", label: "[이전 회사명]" },
  { value: "personal", label: "개인 프로젝트" },
  { value: "team", label: "팀 프로젝트 (회사 외)" },
];

// 사용 기술 선택지에 쓰는 내 기술스택 (S02 데이터)
export const MOCK_MY_SKILLS = ["Java", "Spring Boot", "JPA", "MySQL", "Redis", "Kafka", "AWS"];

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p_102",
    title: "결제 승인 API 성능 개선",
    period: { start: "2024-05", end: "2024-09" },
    affiliation: "c_01",
    skills: ["Spring Boot", "Redis", "Kafka"],
    rawText: [
      "작년 프로모션 때 결제 승인 API가 느려져서 장애 직전까지 갔다. 평균 응답이 1.2초까지 늘었고 결제 이탈이 생겼다. 원인을 보니 승인할 때마다 가맹점 정보를 DB에서 조회하고, 알림이나 포인트 적립 같은 후처리를 동기로 처리하고 있었다.",
      "가맹점 조회는 Redis 캐시로 바꾸고 후처리는 Kafka로 비동기 분리했다. 팀 4명 중 백엔드 리드로 설계와 구현을 맡았다. 그 결과 평균 응답이 0.3초로 줄었다.",
      "그때까지는 프로모션 트래픽을 미리 확인할 방법이 없어서 문제를 운영 중에야 알았다. 그래서 프로모션 전에 실제 트래픽 패턴으로 부하 테스트를 돌리는 절차를 만들고, 장애 대응 매뉴얼도 정리해 팀에 공유했다. 다음 프로모션 피크는 문제없이 넘겼다.",
    ].join("\n\n"),
    repoUrl: "",
    demoUrl: "",
    status: "draft",
  },
  {
    id: "p_103",
    title: "정산 배치 쿼리 개선",
    period: { start: "2023-09", end: "2023-12" },
    affiliation: "c_01",
    skills: ["JPA", "MySQL"],
    rawText: "정산 배치가 마감 시간을 넘기는 일이 잦았다. 실행 계획을 분석해 인덱스를 다시 설계했다.",
    repoUrl: "",
    demoUrl: "",
    status: "confirmed",
  },
];

// 새 프로젝트(/projects/new)의 빈 양식
export const EMPTY_PROJECT: Project = {
  id: "new",
  title: "",
  period: { start: "", end: "" },
  affiliation: "",
  skills: [],
  rawText: "",
  repoUrl: "",
  demoUrl: "",
  status: "draft",
};
