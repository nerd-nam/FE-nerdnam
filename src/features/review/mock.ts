// S05 에서 쓰는 임시 데이터.
// API(C-03 계약)와 공통 예시 데이터(fixtures/)가 나오면 서버에서 받아 온다.
// 내용은 기획서 4.3 과 design/assets/js/review.js 의 예시를 따랐다.
import { MOCK_PROJECTS } from "@/features/project/mock";

// 사례 상태 (기획서 4.3). superseded(다시 나누기로 대체됨)는 화면에 보이지 않아서 여기엔 없다
export type EpisodeStatus = "review" | "confirmed" | "excluded";

export type Metric = { name: string; before: string; after: string; source: string };

// 사례의 한 버전 내용 (v1, v2 …)
export type EpisodeVersion = {
  problem: string;
  solution: string;
  result: string;
  metrics: Metric[];
};

// 확인 필요 질문 (기획서 4.3 unverified)
export type Unverified = { id: string; question: string; placeholder: string };

export type Episode = {
  id: string;
  title: string;
  role: string;
  skills: string[];
  status: EpisodeStatus;
  currentVersion: number;
  versions: Record<number, EpisodeVersion>;
  sourceSpans: [number, number][]; // 원문에서 이 사례의 근거가 된 구간 [시작, 끝) 글자 위치
  unverified: Unverified[];
};

export type ReviewData = {
  projectId: string;
  title: string;
  meta: string; // "OO커머스 · 2024.05 – 2024.09"
  rawText: string;
  answers: { episodeId: string; text: string }[]; // 확인 질문에 답해 원문에 덧붙인 내용
  episodes: Episode[];
};

const project = MOCK_PROJECTS.find((item) => item.id === "p_102")!;
const rawText = project.rawText;

// 원문에서 phrase 가 있는 위치를 [시작, 끝) 으로 돌려준다. 실제로는 AI 가 source_spans 로 준다.
function span(phrase: string): [number, number] {
  const start = rawText.indexOf(phrase);
  if (start < 0) throw new Error(`원문에 없는 문장: ${phrase}`);
  return [start, start + phrase.length];
}

export const MOCK_REVIEW: ReviewData = {
  projectId: "p_102",
  title: project.title,
  meta: "OO커머스 · 2024.05 – 2024.09",
  rawText,
  answers: [{ episodeId: "e_201", text: "피크 TPS 약 2배까지 문제없이 처리" }],
  episodes: [
    {
      id: "e_201",
      title: "결제 승인 응답 지연 개선",
      role: "백엔드 리드 (팀 4명)",
      skills: ["Spring Boot", "Redis", "Kafka"],
      status: "review",
      currentVersion: 2,
      versions: {
        1: {
          problem:
            "프로모션 기간 결제 승인 API의 평균 응답이 1.2초까지 늘어나 결제 이탈이 발생했다. 승인마다 가맹점 정보를 DB에서 조회하고, 알림·포인트 적립 같은 후처리를 동기로 처리한 것이 원인이었다.",
          solution: "가맹점 조회를 Redis 캐시로 전환하고, 승인 후처리를 Kafka 기반 비동기 처리로 분리했다. 팀 4명 중 백엔드 리드로 설계와 구현을 맡았다.",
          result: "평균 응답시간을 1.2초에서 0.3초로 줄였다.",
          metrics: [{ name: "평균 응답시간", before: "1.2초", after: "0.3초", source: "원문" }],
        },
        2: {
          problem:
            "프로모션 기간 결제 승인 API의 평균 응답이 1.2초까지 늘어나 결제 이탈이 발생했다. 승인마다 가맹점 정보를 DB에서 조회하고, 알림·포인트 적립 같은 후처리를 동기로 처리한 것이 원인이었다.",
          solution: "가맹점 조회를 Redis 캐시로 전환하고, 승인 후처리를 Kafka 기반 비동기 처리로 분리했다. 팀 4명 중 백엔드 리드로 설계와 구현을 맡았다.",
          result: "평균 응답시간을 1.2초에서 0.3초로 75% 줄였고, 다음 프로모션에서는 피크 처리량 약 2배를 장애 없이 처리했다.",
          metrics: [
            { name: "평균 응답시간", before: "1.2초", after: "0.3초", source: "원문" },
            { name: "피크 처리량(TPS)", before: "기준", after: "약 2배", source: "확인 질문 답변" },
          ],
        },
      },
      sourceSpans: [
        span("결제 승인 API가 느려져서"),
        span("평균 응답이 1.2초까지 늘었고 결제 이탈이 생겼다."),
        span("승인할 때마다 가맹점 정보를 DB에서 조회"),
        span("알림이나 포인트 적립 같은 후처리를 동기로 처리"),
        span("가맹점 조회는 Redis 캐시로"),
        span("후처리는 Kafka로 비동기 분리"),
        span("팀 4명 중 백엔드 리드"),
        span("평균 응답이 0.3초로 줄었다."),
      ],
      unverified: [
        {
          id: "u_1a",
          question: "결제 이탈이 얼마나 줄었는지는 원문에 없어서 [결과]에 넣지 않았어요. 수치를 알고 있다면 알려 주세요.",
          placeholder: "예: 결제 이탈률 [개선 전]% → [개선 후]%",
        },
      ],
    },
    {
      id: "e_202",
      title: "프로모션 전 부하 테스트 절차 도입",
      role: "절차 설계·문서화",
      skills: [],
      status: "review",
      currentVersion: 1,
      versions: {
        1: {
          problem: "프로모션 트래픽을 미리 확인할 방법이 없어, 성능 문제를 운영 중에야 발견했다.",
          solution: "프로모션 전에 실제 트래픽 패턴으로 부하 테스트를 돌리는 절차를 만들고, 장애 대응 매뉴얼을 정리해 팀에 공유했다.",
          result: "다음 프로모션 피크를 문제없이 넘겼다.",
          metrics: [],
        },
      },
      sourceSpans: [
        span("프로모션 트래픽을 미리 확인할 방법이 없어서 문제를 운영 중에야 알았다."),
        span("프로모션 전에 실제 트래픽 패턴으로 부하 테스트를 돌리는 절차를 만들고"),
        span("장애 대응 매뉴얼도 정리해 팀에 공유"),
        span("다음 프로모션 피크는 문제없이 넘겼다."),
      ],
      unverified: [
        {
          id: "u_2a",
          question:
            "“피크를 문제없이 넘겼다”는 사례 1의 결과이기도 해요. 부하 테스트 절차 덕분에 달라진 점이 있다면 알려 주세요. (예: 미리 찾아낸 병목, 줄어든 장애 대응 시간)",
          placeholder: "예: 프로모션 전 병목 [N]건을 미리 발견",
        },
      ],
    },
  ],
};
