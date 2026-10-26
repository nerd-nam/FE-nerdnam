// S01 소셜 로그인 버튼. 각 회사의 버튼 가이드를 따른다 (FE 결정 2026-10-26, C-02 S01 확인할 것 10)
// - Google (developers.google.com/identity/branding-guidelines): 흰 바탕 #FFFFFF, 테두리 #747775 1px, 글자 #1F1F1F,
//   4색 "G" 로고(색·모양을 바꾸지 않음). 문구는 "Sign in with Google"을 옮긴 "Google 계정으로 로그인"
// - 카카오 (developers.kakao.com/docs/ko/kakaologin/design-guide): 바탕 #FEE500, 모서리 12px, 말풍선 심볼 #000000(빼면 안 됨),
//   글자 #000000 85%. 문구는 공식 레이블 "카카오 로그인"
// 두 버튼은 크기·무게를 같게 둔다(어느 한쪽을 더 눈에 띄게 하지 않는다는 두 가이드 공통 규칙).
// 동의 전(disabled)에는 버튼 모양은 그대로 두고 흐리게만 한다.
import type { MouseEventHandler } from "react";
import { routes } from "@/shared/routes";
import { cx } from "@/shared/ui/cx";
import styles from "./Start.module.css";

export type Provider = "google" | "kakao";

const LABEL: Record<Provider, string> = {
  google: "Google 계정으로 로그인",
  kakao: "카카오 로그인",
};

type SocialLoginButtonProps = {
  provider: Provider;
  disabled?: boolean;
  describedBy?: string; // 눌리지 않는 이유 안내(동의 체크)의 id
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function SocialLoginButton({ provider, disabled, describedBy, onClick }: SocialLoginButtonProps) {
  const className = cx(styles.social, styles[provider]);
  const content = (
    <>
      {provider === "google" ? <GoogleLogo /> : <KakaoSymbol />}
      <span>{LABEL[provider]}</span>
    </>
  );
  // 링크(<a>)는 막을 수 없어서, 동의 전에는 눌리지 않는 버튼으로 보여 준다
  if (disabled) {
    return (
      <button type="button" className={className} disabled aria-describedby={describedBy}>
        {content}
      </button>
    );
  }
  // 서버 주소로 페이지째 이동한다. Link 는 우리 화면 사이를 오가려고 화면 데이터를 미리 받아 두는데, 서버로 가는 주소에서는 그러면 안 된다
  return (
    <a className={className} href={routes.login(provider)} onClick={onClick}>
      {content}
    </a>
  );
}

// Google 표준 4색 "G" (Sign in with Google 버튼 자료의 로고)
function GoogleLogo() {
  return (
    <svg className={styles.socialMark} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// 카카오 말풍선 심볼 (카카오 로그인 버튼 자료의 심볼, #000000)
function KakaoSymbol() {
  return (
    <svg className={styles.socialMark} viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#000000"
        d="M9 .6C4.03.6 0 3.713 0 7.554c0 2.389 1.559 4.495 3.932 5.746l-.999 3.648c-.088.322.28.579.564.391l4.376-2.888c.37.036.745.055 1.127.055 4.97 0 9-3.113 9-6.952C18 3.713 13.97.6 9 .6"
      />
    </svg>
  );
}
