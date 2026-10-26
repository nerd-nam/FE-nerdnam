import Link from "next/link";
import { Suspense } from "react";
import { data, serverApi } from "@/shared/api/server";
import { Icon } from "@/shared/ui/Icon";
import { routes } from "@/shared/routes";
import { cx } from "@/shared/ui/cx";
import styles from "./Layout.module.css";
import { SaveLaterLink } from "./PendingSave";

const MENU = [
  { area: "library", label: "내 경험", href: routes.library },
  { area: "apply", label: "지원 준비", href: routes.applyList },
] as const;

type AppArea = (typeof MENU)[number]["area"];

// 화면 영역마다 머리글 오른쪽이 다르다 (디자인 기준)
// start: S01 시작 / onboarding: S02~S05 / app: S06~S09, S05 읽기 모드(확정한 프로젝트 보기)
// plain: 로고만 (S01-2 약관 동의 — 동의 전에는 다른 화면을 쓸 수 없어 메뉴를 두지 않는다)
// app 일 때는 area 로 지금 어느 메뉴에 있는지 알려 준다. 각 영역의 layout.tsx 가 넘겨 준다.
type HeaderProps = { variant: "start" } | { variant: "onboarding" } | { variant: "plain" } | { variant: "app"; area: AppArea };

export function Header(props: HeaderProps) {
  return (
    // print-hide: PDF로 내보내기(인쇄)할 때 머리글은 빼고 내용만 남긴다
    <header className={cx(styles.header, "print-hide")}>
      <div className={styles.headerInner}>
        {props.variant === "app" ? (
          <div className={styles.headerLeft}>
            <Brand />
            <nav aria-label="주 메뉴" className={styles.nav}>
              {MENU.map((item) => (
                <Link key={item.area} href={item.href} aria-current={item.area === props.area ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ) : (
          <Brand />
        )}

        {props.variant === "start" && (
          <a className={styles.headerLink} href="#start">
            로그인
          </a>
        )}
        {props.variant === "onboarding" && (
          // 화면에 저장하지 않은 변경이 있으면 저장한 뒤 내 경험으로 간다 (PendingSave.tsx)
          <SaveLaterLink className={styles.headerLink} href={routes.library}>
            저장하고 나중에 하기
          </SaveLaterLink>
        )}
        {props.variant === "app" && (
          // 내 정보는 로그인 쿠키로 서버에 물어야 해서 이 동그라미만 Suspense 로 감싼다. 기다리는 동안은 빈 동그라미
          <Suspense fallback={<span className={styles.avatar} aria-hidden="true" />}>
            <Avatar />
          </Suspense>
        )}
      </div>
    </header>
  );
}

// 사용자 이름 첫 글자 (GET /api/me 의 displayName, 없으면 이메일 첫 글자).
// 계정 메뉴(로그아웃·탈퇴)의 내용은 아직 정하지 않았다 (C-02 공통 확인할 것 4) — 지금은 동그라미만.
async function Avatar() {
  const api = await serverApi(routes.library); // 내 정보 조회는 약관 동의 전에도 되므로 돌아올 주소는 쓰이지 않는다
  const me = data(await api.GET("/api/me"));
  const name = me.displayName ?? me.email ?? "";
  return (
    <button type="button" className={styles.avatar} aria-label={name ? `${name} 계정 메뉴` : "계정 메뉴"}>
      {name.trim().charAt(0).toUpperCase()}
    </button>
  );
}

function Brand() {
  return (
    <Link className={styles.brand} href={routes.start}>
      <span className={styles.brandMark}>
        <Icon name="check" size="sm" bold />
      </span>
      <span className={styles.brandName}>nerdnam</span>
    </Link>
  );
}
