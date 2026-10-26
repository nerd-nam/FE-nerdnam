import { NextResponse } from "next/server";
import { USE_PRISM } from "@/shared/api/origin";

// 개발용 로그아웃 대역 (Prism 을 쓸 때만). POST /api/auth/logout 이 여기로 온다 (next.config.ts).
// 진짜 BE 는 세션을 지운다. Prism 은 204 만 주고 쿠키를 못 지우므로, 개발용 로그인(dev-api/login)이 심은 SESSION 쿠키를 여기서 지운다.
export function POST() {
  if (!USE_PRISM || process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }
  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete("SESSION");
  return response;
}
