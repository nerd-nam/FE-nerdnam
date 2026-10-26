import { NextResponse } from "next/server";
import { USE_PRISM } from "@/shared/api/origin";

// 개발용 CSRF 토큰 대역 (Prism 을 쓸 때만). GET /api/auth/csrf 가 여기로 온다 (next.config.ts).
// Prism 의 예시 토큰은 "예시"(한글)라서 요청 머리글에 넣을 수 없다. 그래서 영문 토큰을 대신 준다.
// Prism 은 X-XSRF-TOKEN 머리글이 "있는지"만 본다.
export function GET() {
  if (!USE_PRISM || process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json({ headerName: "X-XSRF-TOKEN", token: "prism-dev" });
}
