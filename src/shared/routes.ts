// 화면 주소를 한곳에 모아 둔다. 주소가 바뀌면 여기만 고치면 된다.
// 화면 ID(S01 …)는 기획서 6장 기준.
export const routes = {
  start: "/", // S01
  skills: "/skills", // S02
  career: "/career", // S03
  projects: "/projects", // S04
  review: "/review", // S05
  library: "/library", // S06
  jd: (id: string) => `/apply/${id}/jd`, // S07
  report: (id: string) => `/apply/${id}/report`, // S08
  guide: (id: string, tab: GuideTab) => `/apply/${id}/guide/${tab}`, // S09
} as const;

// 새 공고는 아직 번호(id)가 없어서 id 자리에 "new" 를 넣는다 → /apply/new/jd
// 그래서 서버가 만드는 공고 번호는 "new" 가 될 수 없다 (백엔드와 공유할 것).
export const NEW_JD_ID = "new";

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
