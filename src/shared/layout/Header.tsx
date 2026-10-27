import Link from "next/link";
import { Suspense } from "react";
import { data, serverApi } from "@/shared/api/server";
import { Icon } from "@/shared/ui/Icon";
import { routes } from "@/shared/routes";
import { cx } from "@/shared/ui/cx";
import styles from "./Layout.module.css";
import { AccountMenu } from "./AccountMenu";
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
            {/* 로그인한 뒤의 로고는 내 경험으로 바로 간다. S01 을 거치면 시작 화면 확인 후 다시 이동해야 한다 (기획서 v1.63) */}
            <Brand href={routes.library} />
            <nav aria-label="주 메뉴" className={styles.nav}>
              {MENU.map((item) => (
                <Link key={item.area} href={item.href} aria-current={item.area === props.area ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ) : (
          <Brand href={routes.start} />
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

// 계정 메뉴: 내 정보(GET /api/me)는 서버에서 가져오고, 여닫기·로그아웃·탈퇴는 AccountMenu(브라우저)가 한다
async function Avatar() {
  // 머리글은 지금 화면 주소를 모른다. 로그인이 풀렸으면(401) 여기서 S01 로 보내지 않고 빈 동그라미만 두고,
  // 화면 쪽 요청이 "다시 로그인하면 이 화면으로" 주소를 붙여 S01 로 보낸다. 내 정보 조회는 약관 동의 전에도 된다
  const api = await serverApi(routes.library, { anonymous: true });
  const me = await api.GET("/api/me");
  if (me.response.status === 401) return <span className={styles.avatar} aria-hidden="true" />;
  const { displayName, email } = data(me);
  return <AccountMenu name={displayName} email={email} />;
}

function Brand({ href }: { href: string }) {
  return (
    <Link className={styles.brand} href={href}>
      <span className={styles.brandMark}>
        <Icon name="check" size="sm" bold />
      </span>
      <span className={styles.brandName}>nerdnam</span>
    </Link>
  );
}
