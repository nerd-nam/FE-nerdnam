import { NextResponse, type NextRequest } from "next/server";
import { RETURN_COOKIE } from "@/features/start/loginReturn";
import { isSafePath, routes } from "@/shared/routes";

// 다시 로그인한 뒤 돌아갈 화면으로 보내고, 적어 둔 쿠키를 지운다 (loginReturn.ts).
// S01 이 로그인을 확인한 뒤 쿠키가 있으면 여기로 보낸다. 화면(서버 컴포넌트)은 쿠키를 지울 수 없어서 따로 둔 주소다.
// 우리 사이트 안 주소가 아니면 S01 로 (S01 이 하던 단계로 다시 보낸다).
export function GET(request: NextRequest) {
  const next = decode(request.cookies.get(RETURN_COOKIE)?.value);
  const response = NextResponse.redirect(new URL(isSafePath(next) ? next : routes.start, request.url));
  response.cookies.delete(RETURN_COOKIE);
  return response;
}

// 누군가 쿠키를 망가뜨려 해석할 수 없으면 없는 것으로 본다
function decode(value: string | undefined) {
  try {
    return value ? decodeURIComponent(value) : undefined;
  } catch {
    return undefined;
  }
}
