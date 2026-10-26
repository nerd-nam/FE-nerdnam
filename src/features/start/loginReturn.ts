// 로그인이 풀려 S01 로 왔을 때(/?next=/apply), 다시 로그인하면 그 화면으로 돌아가게 한다 (FE 결정 2026-10-26, C-02 S01 확인할 것 11).
// 소셜 로그인을 다녀오면 BE 가 S01(/)로 돌려보내므로 주소의 ?next= 는 사라진다. 그래서 버튼을 누를 때 쿠키에 적어 둔다.
// sessionStorage(동의 기억) 대신 쿠키인 이유: S01 이 서버에서 바로 그 화면으로 보내려면 서버가 읽을 수 있어야 한다.
// 로그인 다녀오는 데 필요한 10분만 남기고, 쓰고 나면 /after-login 이 지운다.
export const RETURN_COOKIE = "nerdnam_return_to";
const MAX_AGE_SECONDS = 10 * 60;

// next 가 있으면 적고, 없으면 예전에 남은 값을 지운다 (다른 로그인 때 엉뚱한 화면으로 가지 않게)
export function rememberReturnTo(next: string | undefined) {
  const value = next ? encodeURIComponent(next) : "";
  document.cookie = `${RETURN_COOKIE}=${value}; Max-Age=${next ? MAX_AGE_SECONDS : 0}; Path=/; SameSite=Lax`;
}
