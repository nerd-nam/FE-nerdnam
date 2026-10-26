import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import createClient from "openapi-fetch";
import { routes } from "@/shared/routes";
import { API_ORIGIN } from "./origin";
import { isProblem } from "./problem";
import type { paths } from "./schema";

// 서버에서 데이터 가져오기 (④ 결정: 화면을 열 때 필요한 데이터는 서버에서).
// 페이지(서버 컴포넌트)가 BE 에 직접 묻는다. 브라우저를 거치지 않으니 "대신 전달"(rewrites) 없이 BE 주소로 바로 보낸다.
// 쿠키를 읽으므로 이 코드를 쓰는 컴포넌트는 <Suspense> 안에 둔다 (Next.js 16 cacheComponents 규칙).
//
// 쓰는 법:
//   const api = await serverApi(routes.applyList);         // 지금 화면 주소 (동의 화면에서 돌아올 곳)
//   const postings = data(await api.GET("/api/job-postings"));
export async function serverApi(currentPath: string) {
  // 사용자 데이터는 요청이 올 때마다 새로 묻는다(미리 만들어 두지 않음).
  // openapi-fetch 가 요청마다 Math.random() 으로 번호를 붙이는데, 이 줄이 없으면 Next.js 가 "미리 만들기 중 바뀌는 값"이라고 오류를 낸다
  await connection();
  // 서버에는 사용자의 브라우저 쿠키가 없다. 들어온 요청의 쿠키(SESSION)를 BE 요청에 그대로 옮겨 붙인다
  const cookie = (await cookies()).toString();
  const api = createClient<paths>({ baseUrl: API_ORIGIN, headers: { cookie } });

  api.use({
    async onResponse({ response }) {
      // 로그인이 안 됐거나 풀림 → S01
      if (response.status === 401) redirect(routes.start);
      // 약관 동의가 필요함 → S01-2, 동의한 뒤 이 화면으로 돌아온다
      if (response.status === 403) {
        const body: unknown = await response.clone().json().catch(() => null);
        if (isProblem(body) && body.title === "CONSENT_REQUIRED") redirect(routes.consent(currentPath));
      }
    },
  });
  return api;
}

// 응답에서 데이터만 꺼낸다. 없는 자료·남의 자료(404)면 404 화면, 그 밖의 오류는 던져서 화면이 오류를 보이게 한다
export function data<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.response.status === 404) notFound();
  if (result.data === undefined) throw new Error(`API 오류 ${result.response.status}`, { cause: result.error });
  return result.data;
}
