import { NextResponse, type NextRequest } from "next/server";
import { USE_PRISM } from "@/shared/api/origin";
import { routes } from "@/shared/routes";

// 개발용 로그인 대역 (Prism 을 쓸 때만). 소셜 로그인 버튼 주소(/oauth2/authorization/google·kakao)가 여기로 온다 (next.config.ts).
// 진짜 BE 는 Google·카카오 로그인 뒤 SESSION 쿠키를 심는다. Prism 은 "SESSION 쿠키가 있는지"만 보므로 아무 값이나 심는다.
// 진짜 BE 를 쓰거나 배포한 사이트에서는 404 다.
export function GET(request: NextRequest) {
  if (!USE_PRISM || process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }
  const response = NextResponse.redirect(new URL(routes.start, request.url));
  // 진짜 세션 쿠키처럼: 자바스크립트에서 못 읽고(httpOnly), 브라우저를 닫으면 사라진다(만료일 없음)
  response.cookies.set("SESSION", "prism-dev", { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
