// 계정 동작: 로그아웃·탈퇴. 머리글 계정 메뉴(AccountMenu)와 약관 동의 화면(ConsentCard)이 같이 쓴다.
// 성공하면 S01 로 페이지째 다시 연다 — 브라우저가 기억해 둔 로그인 상태의 화면 데이터를 남기지 않기 위해서다.
// 실패하면 화면에 띄울 문장을 돌려준다 (성공하면 페이지가 바뀌므로 돌려줄 일이 없다).
import { routes } from "@/shared/routes";
import { api, resetCsrf } from "./client";
import { problemMessage } from "./problem";

function leave() {
  resetCsrf(); // 로그아웃·탈퇴 뒤에는 CSRF 토큰을 새로 받는다 (C-03)
  window.location.replace(routes.start);
}

export async function logout() {
  const { error } = await api.POST("/api/auth/logout");
  if (error) return problemMessage(error, "로그아웃하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  leave();
  return null;
}

export async function withdraw() {
  const { error } = await api.DELETE("/api/me");
  if (error) return problemMessage(error, "탈퇴하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  leave();
  return null;
}
