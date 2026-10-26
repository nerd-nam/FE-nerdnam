import type { components } from "./schema";

// 서버 오류 응답(ProblemDetail, C-03 계약)
// title: 오류 코드(대문자, 예: CONSENT_REQUIRED) / detail: 사용자에게 보여 줄 문장 / status: HTTP 상태 번호
export type Problem = components["schemas"]["ProblemDetail"];

export function isProblem(value: unknown): value is Problem {
  return typeof value === "object" && value !== null && "title" in value && "status" in value;
}

// 화면에 띄울 오류 문장. 서버가 준 detail 이 있으면 그것을, 없으면(네트워크 끊김 등) 화면이 정한 문장을 쓴다
export function problemMessage(error: unknown, fallback: string) {
  return isProblem(error) && error.detail ? error.detail : fallback;
}
