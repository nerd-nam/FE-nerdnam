// S07 공고 양식: 화면에서 쓰는 모양과 서버(C-03 계약 JobPostingView·PostingRequest) 사이 변환 (기획서 F4·4.5)
import type { components } from "@/shared/api/schema";

type PostingView = components["schemas"]["JobPostingView"];
type PostingRequest = components["schemas"]["PostingRequest"];

// 공고 양식. 목록은 "한 줄에 하나"인 글자 목록이다
export type JdDraft = {
  id: number | null; // 서버 번호. 새 공고(/apply/new/jd)는 처음 저장하기 전까지 null
  version: number | null; // 서버가 준 수정 번호. 그사이 다른 곳에서 고쳤으면 저장 때 409
  company: string;
  position: string;
  url: string; // 공고 링크 (선택, 나중에 다시 보기용)
  required: string[]; // 필수사항
  preferred: string[]; // 우대사항
  duties: string[]; // 주요 업무 (지원동기용, 판정에 쓰지 않음). 서버 이름은 tasks
  intro: string; // 회사 소개·인재상 (지원동기용)
};

// 새 공고의 빈 양식. 목록마다 빈 줄 하나로 시작한다
export const EMPTY_JD: JdDraft = {
  id: null,
  version: null,
  company: "",
  position: "",
  url: "",
  required: [""],
  preferred: [""],
  duties: [""],
  intro: "",
};

// 서버의 목록이 비어 있으면 빈 줄 하나를 둬서 바로 적을 수 있게 한다
const orBlank = (lines: string[]) => (lines.length ? lines : [""]);

export function toJdDraft(p: PostingView): JdDraft {
  return {
    id: p.id,
    version: p.version,
    company: p.companyName,
    position: p.positionName,
    url: p.postingUrl ?? "",
    required: orBlank(p.required.map((r) => r.text)),
    preferred: orBlank(p.preferred.map((r) => r.text)),
    duties: orBlank(p.tasks),
    intro: p.companyIntro,
  };
}

// 빈 줄은 저장하지 않는다 (기획서 F4). 서버 오류의 줄 번호(index)도 이 "채운 줄" 기준이다
const filled = (lines: string[]) => lines.map((l) => l.trim()).filter(Boolean);

export function toPostingRequest(d: JdDraft): PostingRequest {
  return {
    companyName: d.company.trim(),
    positionName: d.position.trim(),
    postingUrl: d.url.trim() || null,
    required: filled(d.required),
    preferred: filled(d.preferred),
    tasks: filled(d.duties),
    companyIntro: d.intro.trim(),
    version: d.version,
  };
}

// 저장한 것과 양식이 같은지 (저장할 것이 있는지 볼 때)
export function sameJd(a: JdDraft, b: JdDraft) {
  return JSON.stringify(toPostingRequest(a)) === JSON.stringify(toPostingRequest(b));
}
