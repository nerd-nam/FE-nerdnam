import createClient from "openapi-fetch";
import { routes } from "@/shared/routes";
import { isProblem } from "./problem";
import type { paths } from "./schema";

// 브라우저에서 데이터 가져오기·바꾸기 (④ 결정: 저장·삭제처럼 버튼을 눌러 생기는 일, AI 작업 진행 상태 확인).
// 우리 주소(/api/…)로 보내면 Next.js 가 BE 로 대신 전달한다 (next.config.ts rewrites). 같은 주소라 쿠키가 따라간다.
//
// 쓰는 법 ("use client" 컴포넌트 안에서):
//   const { error } = await api.DELETE("/api/job-postings/{postingId}", { params: { path: { postingId: 1 } } });
//   if (error) setMessage(problemMessage(error, "삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
export const api = createClient<paths>({ baseUrl: "" });

// CSRF 토큰: 상태를 바꾸는 요청(POST·PUT·PATCH·DELETE)에는 X-XSRF-TOKEN 머리글이 필요하다 (C-03).
// 처음 필요할 때 한 번 받아 두고 계속 쓴다. 로그인·로그아웃 뒤에는 resetCsrf() 로 버려서 새로 받게 한다.
let csrf: Promise<{ headerName: string; token: string }> | null = null;

export function resetCsrf() {
  csrf = null;
}

async function csrfToken() {
  csrf ??= fetch("/api/auth/csrf").then((r) => {
    if (!r.ok) throw new Error(`CSRF 토큰을 받지 못했어요 (${r.status})`);
    return r.json();
  });
  try {
    return await csrf;
  } catch (e) {
    csrf = null; // 실패한 것은 기억하지 않고 다음 요청 때 다시 받는다
    throw e;
  }
}

api.use({
  async onRequest({ request }) {
    if (request.method === "GET") return;
    const { headerName, token } = await csrfToken();
    request.headers.set(headerName, token);
    return request;
  },
  async onResponse({ response }) {
    // 로그인이 풀림 → S01
    if (response.status === 401) {
      window.location.assign(routes.start);
      return;
    }
    // 약관 동의가 필요함 → S01-2, 동의한 뒤 지금 화면으로 돌아온다
    if (response.status === 403) {
      const body: unknown = await response.clone().json().catch(() => null);
      if (isProblem(body) && body.title === "CONSENT_REQUIRED") {
        window.location.assign(routes.consent(window.location.pathname + window.location.search));
      }
    }
  },
});
