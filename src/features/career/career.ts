// S03 경력: 화면에서 쓰는 모양과 서버(C-03 계약 CareerResponse·CareerRequest) 사이 변환 (기획서 4.2)
import type { components } from "@/shared/api/schema";

type ApiCareer = components["schemas"]["CareerResponse"];
type CareerRequest = components["schemas"]["CareerRequest"];

// 고용형태 (기획서 4.2). 저장 값은 계약의 소문자 값
export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "정규직" },
  { value: "contract", label: "계약직" },
  { value: "intern", label: "인턴" },
  { value: "freelance", label: "프리랜서" },
] as const satisfies { value: CareerRequest["employmentType"]; label: string }[];

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]["value"];

export const MAX_DUTIES = 5; // 주요 업무 최대 5줄 (기획서 4.2)

export type Career = {
  id: number | null; // 서버 번호. 아직 저장하지 않은 새 경력은 null
  version: number | null; // 서버가 준 수정 번호. 그사이 다른 곳에서 고쳤으면 저장 때 409 (BE CareerService)
  company: string;
  team: string; // 부서 (필수)
  jobTitle: string; // 직무 (필수)
  position: string; // 직급 (선택)
  employmentType: EmploymentType;
  start: string; // "YYYY-MM"
  end: string | null; // null 이면 재직 중
  duties: string[];
  skillIds: number[]; // 이 회사에서 쓴 기술 = 내 기술스택의 번호(userSkillId)
};

export function toCareer(c: ApiCareer): Career {
  return {
    id: c.id,
    version: c.version,
    company: c.companyName,
    team: c.teamName,
    jobTitle: c.jobTitle,
    position: c.positionTitle ?? "",
    employmentType: c.employmentType,
    start: c.startMonth,
    end: c.endMonth,
    duties: c.duties,
    skillIds: c.userSkillIds,
  };
}

// 저장할 때 보내는 모양. 빈 줄 업무는 빼고, 앞뒤 빈칸은 지운다
export function toRequest(c: Career): CareerRequest {
  return {
    companyName: c.company.trim(),
    teamName: c.team.trim(),
    jobTitle: c.jobTitle.trim(),
    positionTitle: c.position.trim() || null,
    employmentType: c.employmentType,
    startMonth: c.start,
    endMonth: c.end,
    duties: cleanDuties(c.duties),
    userSkillIds: c.skillIds,
    version: c.version,
  };
}

function cleanDuties(duties: string[]) {
  return duties.map((d) => d.trim()).filter(Boolean);
}

// 새 경력의 빈 양식
export function emptyCareer(): Career {
  return {
    id: null,
    version: null,
    company: "",
    team: "",
    jobTitle: "",
    position: "",
    employmentType: "full_time",
    start: "",
    end: null,
    duties: [""],
    skillIds: [],
  };
}

// 저장한 것과 양식이 같은지 (저장하지 않은 변경이 있는지 볼 때). 저장할 때와 같은 규칙으로 정리해서 비교한다
export function sameCareer(a: Career, b: Career) {
  const norm = (c: Career) => ({ ...toRequest(c), userSkillIds: [...c.skillIds].sort((x, y) => x - y) });
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
}

// 필수 칸 오류 (재직기간은 PeriodField 의 periodErrors 가 따로 본다)
export function requiredErrors(c: Career) {
  return {
    company: c.company.trim() ? null : "회사명을 입력해 주세요.",
    team: c.team.trim() ? null : "부서를 입력해 주세요.",
    jobTitle: c.jobTitle.trim() ? null : "직무를 입력해 주세요.",
  };
}

// "2023-03" → "2023.03"
export function formatMonth(value: string) {
  return value.replace("-", ".");
}
