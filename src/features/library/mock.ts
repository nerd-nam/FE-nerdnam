// S06 에서 쓰는 임시 데이터. API 가 생기면 서버에서 받아 온다 (C-02 S06: 요약 API 하나로 받을지는 확인할 것 1번).
// 내용은 design/library.html 을 따랐다. 다른 화면의 임시 데이터와 상태가 조금 다를 수 있다 (fixtures/ 가 나오면 하나로 맞춘다).

// 프로젝트 상태: 초안 → 검토 중 → 확정 (기획서 4.3), 확정 후 고치는 중이면 재등록 중 (ADR-0002)
export type LibraryProjectStatus = "draft" | "review" | "confirmed" | "reregistering";

export type LibraryEpisode = { title: string; summary: string }; // summary: "문제 → 해결 → 결과" 한 줄 (만드는 곳은 C-02 S06 확인할 것 2번)

export type LibraryProject = {
  id: string;
  title: string;
  status: LibraryProjectStatus;
  meta: string; // 소속 · 기간
  skills: string[];
  episodes: LibraryEpisode[]; // 확정한 사례 (재등록 중이면 이전 확정 사례)
};

export const MOCK_LIBRARY_PROJECTS: LibraryProject[] = [
  {
    id: "p_102",
    title: "결제 승인 API 성능 개선",
    status: "review", // S05 임시 데이터와 맞춤 (검토 중)
    meta: "OO커머스 · 2024.05 – 2024.09",
    skills: ["Spring Boot", "Redis", "Kafka"],
    episodes: [
      { title: "결제 승인 응답 지연 개선", summary: "응답 1.2초·결제 이탈 → Redis 캐시, Kafka 비동기 분리 → 평균 응답 0.3초, 피크 처리량 약 2배" },
      { title: "프로모션 전 부하 테스트 절차 도입", summary: "문제를 운영 중에야 발견 → 부하 테스트 절차·장애 대응 매뉴얼 → [확인한 결과]" },
    ],
  },
  {
    id: "p_103",
    title: "정산 배치 쿼리 개선",
    status: "confirmed",
    meta: "OO커머스",
    skills: ["Spring Batch", "MySQL", "JPA"],
    episodes: [{ title: "정산 배치 쿼리 개선", summary: "배치가 마감 시간을 넘김 → 실행 계획 분석, 인덱스 재설계 → [배치 처리 시간 변화]" }],
  },
  // 재등록 중: 확정했다가 "수정"을 눌러 다시 등록하는 중. 이전에 확정한 사례는 매칭에 계속 쓰인다 (ADR-0002)
  // S08 근거 링크(재등록 중이면 이 카드로 옴, FE-nerdnam #4) 확인용. 결과의 [대괄호]는 원문에 없는 자리표시
  {
    id: "p_106",
    title: "알림 발송 비동기화",
    status: "reregistering",
    meta: "OO커머스",
    skills: ["Spring Boot", "Kafka"],
    episodes: [{ title: "알림 발송 지연 개선", summary: "알림 발송이 결제 응답을 늦춤 → Kafka로 발송 분리 → [발송 지연 변화]" }],
  },
  {
    id: "p_104",
    title: "[세 번째 프로젝트 제목]",
    status: "draft",
    meta: "",
    skills: [],
    episodes: [],
  },
];
