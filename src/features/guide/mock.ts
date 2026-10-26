// S09 에서 쓰는 임시 데이터.
// API(C-03 계약)와 공통 예시 데이터(fixtures/)가 나오면 이 파일 대신 서버에서 받아 온다.
// 내용은 기획서 7.2 와 design/assets/js/guide-data.js 를 따랐다.
import type { RequirementType } from "@/features/report/report";
import type { Evidence } from "@/shared/evidence";
import type { GuideTab } from "@/shared/routes";

// 근거 예시 (S08 이 서버에 연결되기 전 S08 임시 데이터에 있던 것)
const CAREER_OO: Evidence = { kind: "career", label: "경력 · OO커머스" };
// 사례 근거는 확정한 프로젝트에만 있다. p_105·p_103 은 예전 S05 임시 데이터의 확정 프로젝트
const EP_PAYMENT: Evidence = { kind: "episode", label: "결제 승인 API 성능 개선", projectId: "p_105", episodeId: "e_501" };
const EP_BATCH: Evidence = { kind: "episode", label: "정산 배치 쿼리 개선", projectId: "p_103", episodeId: "e_301" };

// 탭마다 따로 만든다: 만드는 중 / 완료 / 실패 (C-02 S09 확인할 것 2번, 작업 상태 조회)
export type GuideStatus = "done" | "generating" | "failed";

// 문단 구성의 한 줄: 제목, 설명, 근거
export type OutlineItem = { title: string; desc: string; sources: Evidence[] };

// 네 탭(지원동기·자기소개·포트폴리오·경력기술서)이 같이 가진 내용 (기획서 F5 "산출물 4종 방향성")
export type GuideDoc = {
  message: string; // 핵심 메시지
  outlineTitle: string; // "문단 구성" · "포트폴리오 구성" · "작성 순서"
  outline: OutlineItem[];
  keywords: string[]; // 강조할 키워드
  avoid: string[]; // 피해야 할 것
  regenHint: string; // "방향 바꾸기" 입력칸 예시
};

// 자기소개: 요건 커버리지 (요건마다 어느 문단이 다루는지)
export type CoverageRow = { text: string; type: RequirementType; covered: boolean; where: string };
// 경력기술서: 공고 용어로 바꿔 쓰기
export type RewriteRow = { from: string; to: string; requirement: string };
// 경력기술서 미리보기. 웹이 바꿔 쓰기 표로 만들지, 서버가 줄지는 미정 (C-02 S09 확인할 것 3번)
export type CareerPreview = { company: string; team: string; period: string; items: { title: string; detail: string }[] };

// 포트폴리오 페이지 흐름 (C-02 S09 포트폴리오 탭, 작업목록 AI-09)
// kind 는 4종만 온다(cover·text·diagram·chart). 그래도 모르는 값이 오면 웹은 텍스트 그림으로 대신한다 (FE-14).
// 시각자료 미리보기(visual)는 없다 — 차트·도식은 사용자가 도구로 만든다 (D-1 결정: 안내만)
export type PageKind = "cover" | "text" | "diagram" | "chart";
export type PortfolioPage = {
  order: number; // 몇 쪽인지. 이 순서로 정렬해 보여 준다
  title: string;
  hint: string; // 이 쪽에 넣을 내용
  tool: string; // 제작 도구: 이미지 생성 · 텍스트 · 다이어그램 · 차트
  kind: string; // PageKind 가 아닐 수도 있어서 string 으로 받는다
  episodeId: string; // 이 쪽이 쓰는 사례
};
export type PageFlow = { projectTitle: string; pages: PortfolioPage[] };

// 이미지 프롬프트 탭 (C-02 S09, 기획서 F6·7.3, 작업목록 AI-10)
// 분위기를 전하는 그림만 이미지 생성 프롬프트로 주고, 글자·숫자가 정확해야 하는 도식·차트는 도구 안내만 준다 (D-1 결정: 안내만)
export type ImagePrompt = {
  id: string;
  title: string;
  purpose: string; // 용도: "포트폴리오 1쪽 커버"
  ratio: string; // 비율: "16:9"
  prompt: string; // 영문 프롬프트
  negative: string; // 제외 요소
};
export type ToolVisual = { name: string; where: string; tool: string }; // 도구로 만들 시각자료: 이름, 위치, 도구
export type ImageGuide = { prompts: ImagePrompt[]; toolVisuals: ToolVisual[]; regenHint: string };

// "이 방향에 쓰인 근거" 목록
export type GuideSource = { evidence: Evidence; requirementCount: number };

export type Guide = {
  jdId: string;
  company: string;
  position: string;
  status: Record<GuideTab, GuideStatus>;
  docs: {
    motive: GuideDoc;
    intro: GuideDoc & { coverage: CoverageRow[] };
    portfolio: GuideDoc & { pageFlow: PageFlow };
    career: GuideDoc & { rewrites: RewriteRow[]; preview: CareerPreview };
  };
  image: ImageGuide;
  sources: GuideSource[];
};

const DOCS: Guide["docs"] = {
  motive: {
    outlineTitle: "문단 구성",
    regenHint: "예: 회사의 기술 블로그 이야기로 시작하고 싶어요",
    message: "결제 성능 문제를 풀어 본 경험을, 더 큰 결제 트래픽에서 이어 가고 싶다.",
    outline: [
      {
        title: "회사가 지금 풀고 있는 문제",
        desc: "공고의 주요 업무 “대용량 트래픽 대응을 위한 아키텍처 개선”에서 출발하세요. 회사 서비스와 최근 소식은 직접 확인해 채우세요: [회사 관련 사실]",
        sources: [],
      },
      { title: "내가 겪은 비슷한 문제", desc: "프로모션 피크에 결제 승인 응답이 1.2초까지 늘었던 상황", sources: [EP_PAYMENT] },
      { title: "합류하면 기여할 지점", desc: "캐시와 비동기 분리로 병목을 줄인 방식을 결제 승인·정산 시스템 개선에 잇기", sources: [EP_PAYMENT] },
    ],
    keywords: ["결제 승인", "대용량 트래픽", "아키텍처 개선"],
    avoid: ["회사 칭찬만 나열하기", "확인하지 않은 회사 정보 쓰기"],
  },
  intro: {
    outlineTitle: "문단 구성",
    regenHint: "예: 협업 경험을 더 앞에 두고 싶어요",
    message: "병목을 수치로 찾고, 구조로 해결하는 백엔드 개발자",
    outline: [
      { title: "한 문장 소개", desc: "핵심 메시지를 첫 문장으로 쓰고, Spring 기반으로 3년 넘게 일했다는 점을 함께 밝히세요.", sources: [CAREER_OO] },
      { title: "대표 근거 1 · 필수 “대용량 트래픽” 대응", desc: "평균 응답 1.2초 → 0.3초, 피크 처리량 약 2배를 장애 없이 처리", sources: [EP_PAYMENT] },
      { title: "대표 근거 2 · 필수 “RDBMS·쿼리 튜닝” 대응", desc: "정산 배치의 실행 계획 분석과 인덱스 재설계", sources: [EP_BATCH] },
      { title: "일하는 방식", desc: "팀 4명 중 백엔드 리드로 설계부터 구현까지 맡은 경험", sources: [EP_PAYMENT] },
    ],
    keywords: ["응답시간 75% 단축", "비동기 처리", "쿼리 튜닝"],
    avoid: ["기술 이름만 나열하기", "원문에 없는 수치 덧붙이기"],
    coverage: [
      { text: "Java/Spring 기반 개발 경력 3년 이상", type: "required", covered: true, where: "문단 1 · 한 문장 소개" },
      { text: "대용량 트래픽 처리 경험", type: "required", covered: true, where: "문단 2 · 결제 승인 API" },
      { text: "RDBMS 설계 및 쿼리 튜닝 경험", type: "required", covered: true, where: "문단 3 · 정산 배치" },
      { text: "Kafka 등 메시지 큐 운영 경험", type: "preferred", covered: true, where: "문단 2 · 비동기 분리" },
      { text: "결제·금융 도메인 경험", type: "preferred", covered: false, where: "경력기술서에서 범위를 밝혀 다루기" },
      { text: "Kubernetes 운영 경험", type: "preferred", covered: false, where: "다루지 않음 · 근거 없음" },
    ],
  },
  portfolio: {
    outlineTitle: "포트폴리오 구성",
    regenHint: "예: 정산 배치 프로젝트를 먼저 보여 주고 싶어요",
    message: "문제 → 설계 선택의 이유 → Before/After 수치 순서로 보여 주기",
    outline: [
      {
        title: "대표 프로젝트 1 · 결제 승인 API 성능 개선",
        desc: "필수 “대용량 트래픽”과 우대 “메시지 큐”를 함께 증명해요. 아래 6쪽 흐름으로 구성하세요.",
        sources: [EP_PAYMENT],
      },
      { title: "대표 프로젝트 2 · 정산 배치 쿼리 개선", desc: "필수 “RDBMS·쿼리 튜닝” 대응. 실행 계획 전후 비교를 표로 정리하세요.", sources: [EP_BATCH] },
      { title: "학습 중 · Kubernetes", desc: "개인 학습이 있다면 맨 끝에 “학습 중”으로 따로 표기하세요.", sources: [] },
    ],
    keywords: ["설계 선택의 이유", "Before/After"],
    avoid: ["모든 프로젝트를 시간순으로 나열하기", "생성 이미지에 수치 넣기"],
    // 디자인 guide-data.js 의 pages. 디자인의 kind "image" 는 C-02·AI-09 의 이름 "cover" 로 바꿨다
    pageFlow: {
      projectTitle: "결제 승인 API 성능 개선",
      pages: [
        { order: 1, title: "커버", hint: "프로젝트명 · 역할 · 기간", tool: "이미지 생성", kind: "cover", episodeId: "e_501" },
        { order: 2, title: "문제", hint: "평균 응답 1.2초, 결제 이탈 발생", tool: "텍스트", kind: "text", episodeId: "e_501" },
        { order: 3, title: "원인", hint: "승인마다 DB 조회 + 동기 후처리 구조", tool: "다이어그램", kind: "diagram", episodeId: "e_501" },
        { order: 4, title: "해결 설계", hint: "Redis 캐시 · Kafka 비동기 분리, 선택 이유", tool: "다이어그램", kind: "diagram", episodeId: "e_501" },
        { order: 5, title: "결과", hint: "평균 응답 1.2초 → 0.3초 · 피크 처리량 약 2배", tool: "차트", kind: "chart", episodeId: "e_501" },
        { order: 6, title: "배운 점", hint: "다음에 다르게 할 것 · [직접 작성]", tool: "텍스트", kind: "text", episodeId: "e_501" },
      ],
    },
  },
  career: {
    outlineTitle: "작성 순서",
    regenHint: "예: 이전 회사 경력도 공고에 맞춰 바꿔 줘",
    message: "OO커머스 업무를 공고 용어로 다시 쓰고, 업무마다 성과를 한 줄씩",
    outline: [
      {
        title: "OO커머스 · 결제플랫폼팀 (2023.03 – 현재)",
        desc: "최근 경력을 맨 위에. 업무 문장은 아래 “공고 용어로 바꿔 쓰기”를 참고하세요.",
        sources: [CAREER_OO],
      },
      { title: "업무별 성과 한 줄", desc: "평균 응답 1.2초 → 0.3초 · 승인 후처리 Kafka 비동기 분리", sources: [EP_PAYMENT] },
      { title: "도메인 범위 밝히기", desc: "“커머스 결제”로 정확히 쓰고, 금융권 경험으로 넓히지 않기", sources: [] },
    ],
    keywords: ["대용량 트래픽", "메시지 큐", "결제 승인·정산"],
    avoid: ["담당 업무만 쓰고 성과 빼기"],
    rewrites: [
      { from: "결제 승인·취소 API 설계와 운영", to: "대용량 결제 트래픽을 처리하는 승인·취소 API 설계·운영", requirement: "필수 · 대용량 트래픽" },
      { from: "정산 배치 개발과 쿼리 성능 개선", to: "정산 배치 개발, 실행 계획 분석과 인덱스 재설계로 쿼리 튜닝", requirement: "필수 · 쿼리 튜닝" },
      { from: "(프로젝트) 후처리를 Kafka로 비동기 분리", to: "Kafka 기반 메시지 큐로 결제 승인 후처리 비동기화", requirement: "우대 · 메시지 큐" },
    ],
    preview: {
      company: "OO커머스",
      team: "결제플랫폼팀 · 백엔드 개발자",
      period: "2023.03 – 현재",
      items: [
        {
          title: "대용량 결제 트래픽을 처리하는 승인·취소 API 설계·운영",
          detail: "Redis 캐시와 Kafka 비동기 분리로 프로모션 피크 평균 응답 1.2초 → 0.3초",
        },
        { title: "정산 배치 개발, 실행 계획 분석과 인덱스 재설계로 쿼리 튜닝", detail: "[배치 처리 시간 변화]" },
      ],
    },
  },
};

// 디자인 guide-data.js 의 image 와 기획서 7.3 예시
const IMAGE: ImageGuide = {
  regenHint: "예: 커버를 더 밝은 톤으로 바꿔 줘",
  prompts: [
    {
      id: "img1",
      title: "커버 이미지 · 결제 승인 API 성능 개선",
      purpose: "포트폴리오 1쪽 커버",
      ratio: "16:9",
      prompt:
        "Clean isometric illustration of a payment request flowing through a fast server pipeline, a glowing cache layer and an asynchronous message queue branching off, minimal flat tech style, navy and teal palette, soft lighting, white background, 16:9, no text, no logos",
      negative: "text, letters, numbers, brand logos, cluttered background, photorealistic people",
    },
    {
      id: "img2",
      title: "개념 이미지 · 동기 처리 vs 비동기 처리",
      purpose: "포트폴리오 4쪽 보조 이미지",
      ratio: "4:3",
      prompt:
        "Two side-by-side minimal abstract compositions: on the left a single long chain of blocks waiting in a queue, on the right a short chain with branches flowing in parallel, flat vector style, navy, teal and light gray, white background, 4:3, no text",
      negative: "text, labels, numbers, logos, 3D clutter",
    },
  ],
  toolVisuals: [
    { name: "원인 구조 도식", where: "포트폴리오 3쪽", tool: "다이어그램" },
    { name: "해결 설계 Before/After 도식", where: "포트폴리오 4쪽", tool: "다이어그램" },
    { name: "응답시간 비교 차트", where: "포트폴리오 5쪽", tool: "차트" },
  ],
};

const SOURCES: GuideSource[] = [
  { evidence: EP_PAYMENT, requirementCount: 3 },
  { evidence: EP_BATCH, requirementCount: 1 },
  { evidence: CAREER_OO, requirementCount: 2 },
];

const ALL_DONE: Guide["status"] = { motive: "done", intro: "done", portfolio: "done", career: "done", image: "done" };

// j_201: 다섯 탭 모두 완료. j_204: 상태 화면 확인용 (지원동기 만드는 중, 자기소개 실패)
const MOCK_GUIDES: Record<string, Guide> = {
  j_201: {
    jdId: "j_201",
    company: "OO페이",
    position: "백엔드 개발자 (결제 플랫폼)",
    status: ALL_DONE,
    docs: DOCS,
    image: IMAGE,
    sources: SOURCES,
  },
  j_204: {
    jdId: "j_204",
    company: "◇◇페이먼츠",
    position: "백엔드 개발자",
    status: { ...ALL_DONE, motive: "generating", intro: "failed" },
    docs: DOCS,
    image: IMAGE,
    sources: SOURCES,
  },
};

// MOCK_GUIDES[id] 로 바로 꺼내면 id 가 "constructor" 같은 글자일 때 엉뚱한 값이 나와서 hasOwn 으로 확인한다
export function findGuide(jdId: string): Guide | undefined {
  return Object.hasOwn(MOCK_GUIDES, jdId) ? MOCK_GUIDES[jdId] : undefined;
}
