// S01 에서 받은 개인정보 동의를 소셜 로그인 다녀오는 동안 기억해 둔다 (C-02 S01 확인할 것 6).
// 서버는 로그인한 뒤에야 누구인지 알아서, 동의 기록(POST /api/me/consents)은 로그인 직후에 보낸다.
// Google·카카오 화면을 다녀와도 같은 탭이면 sessionStorage 가 남아 있다. 탭을 닫으면 사라진다.
// 저장이 막힌 브라우저(사생활 보호 모드 등)에서는 기억하지 못하고, 그때는 약관 동의 화면(S01-2)에서 한 번 더 받는다.
const KEY = "nerdnam.loginConsent";

// 로그인 다녀오는 데 필요한 시간만 기억한다. 이미 동의 기록이 있는 사용자는 이 값을 쓰지 않아 남는데,
// 나중에 약관이 바뀌었을 때 예전 체크로 새 약관에 동의한 것처럼 되지 않게 10분이 지나면 버린다.
const VALID_MS = 10 * 60 * 1000;

export function rememberLoginConsent() {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {}
}

// 기억한 동의를 꺼내면서 지운다 (한 번만 쓴다)
export function takeLoginConsent() {
  try {
    const savedAt = Number(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    return savedAt > 0 && Date.now() - savedAt < VALID_MS;
  } catch {
    return false;
  }
}
