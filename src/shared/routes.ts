// 화면 주소를 한곳에 모아 둔다. 주소가 바뀌면 여기만 고치면 된다.
// 화면 ID(S01 …)는 기획서 6장 기준.
export const routes = {
  start: "/", // S01
  // 소셜 로그인 시작 (BE 주소, Next.js 가 대신 전달). 끝나면 BE 가 S01 로 돌려보낸다(실패면 /?login=failed)
  login: (provider: "google" | "kakao") => `/oauth2/authorization/${provider}`,
  // S01-2 약관 동의. next: 동의한 뒤 돌아갈 화면 (403 CONSENT_REQUIRED 를 받은 화면)
  consent: (next?: string) => `/consent${next ? `?next=${encodeURIComponent(next)}` : ""}`,
  skills: "/skills", // S02
  career: "/career", // S03
  project: (id: string) => `/projects/${id}`, // S04
  review: (id: string) => `/projects/${id}/review`, // S05
  // S05 읽기 모드에서 사례 하나를 펼쳐 열기 (S08 사례 근거 → 여기, 기획서 v1.17)
  reviewEpisode: (id: string, episodeId: string) => `/projects/${id}/review#${episodeId}`,
  library: "/library", // S06
  // S06 에서 프로젝트 카드 하나로 바로 가기 (S08 사례 근거의 프로젝트가 재등록 중일 때, FE-nerdnam #4)
  libraryProject: (id: string) => `/library#${id}`,
  applyList: "/apply", // S10 공고 목록 (목록만 MVP, 기획서 v1.11)
  jd: (id: string) => `/apply/${id}/jd`, // S07
  // S08. analysisId 를 주면 예전 분석 (분석 기록, FE-nerdnam #5). 없으면 가장 최근 분석
  report: (id: string, analysisId?: string) => `/apply/${id}/report${analysisId ? `?analysis=${analysisId}` : ""}`,
  guide: (id: string, tab: GuideTab) => `/apply/${id}/guide/${tab}`, // S09
} as const;

// 새 공고·새 프로젝트는 아직 번호(id)가 없어서 id 자리에 "new" 를 넣는다 → /apply/new/jd, /projects/new
// 그래서 서버가 만드는 공고·프로젝트 번호는 "new" 가 될 수 없다 (기획서 4.5, v1.11).
// 번호 없이 /projects 로 들어오면 /library 로 보낸다 (next.config.ts 의 redirects).
export const NEW_JD_ID = "new";
export const NEW_PROJECT_ID = "new";

// S09 작성 방향 탭. 주소 끝부분 값은 디자인 guide.html 의 #motive 등을 따랐다.
export const GUIDE_TABS = [
  { tab: "motive", label: "지원동기" },
  { tab: "intro", label: "자기소개" },
  { tab: "portfolio", label: "포트폴리오" },
  { tab: "career", label: "경력기술서" },
  { tab: "image", label: "이미지 프롬프트" },
] as const;

export type GuideTab = (typeof GUIDE_TABS)[number]["tab"];

export function isGuideTab(value: string): value is GuideTab {
  return GUIDE_TABS.some((item) => item.tab === value);
}

// 동의 후 돌아갈 주소(next)가 우리 사이트 안 주소인지 확인한다. 아니면 내 경험으로.
// "/consent?next=https://다른사이트" 같은 링크로 사용자를 밖으로 보내는 것을 막는다.
// "/" 로 시작하되 "//"(다른 사이트를 뜻함)나 "/\" 는 안 된다.
export function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : routes.library;
}
