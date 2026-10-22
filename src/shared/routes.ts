// 화면 주소를 한곳에 모아 둔다. 주소가 바뀌면 여기만 고치면 된다.
// 화면 ID(S01 …)는 기획서 6장 기준.
export const routes = {
  start: "/", // S01
  skills: "/skills", // S02
  career: "/career", // S03
  project: (id: string) => `/projects/${id}`, // S04
  review: (id: string) => `/projects/${id}/review`, // S05
  library: "/library", // S06
  applyList: "/apply", // S10 공고 목록 (목록만 MVP, 기획서 v1.11)
  jd: (id: string) => `/apply/${id}/jd`, // S07
  report: (id: string) => `/apply/${id}/report`, // S08
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
