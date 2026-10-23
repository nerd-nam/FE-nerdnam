import Link from "next/link";
import { Icon } from "@/shared/ui/Icon";
import { routes } from "@/shared/routes";
import styles from "./Layout.module.css";

const MENU = [
  { area: "library", label: "내 경험", href: routes.library },
  { area: "apply", label: "지원 준비", href: routes.applyList },
] as const;

type AppArea = (typeof MENU)[number]["area"];

// 화면 영역마다 머리글 오른쪽이 다르다 (디자인 기준)
// start: S01 시작 / onboarding: S02~S05 / app: S06~S09, S05 읽기 모드(확정한 프로젝트 보기)
// app 일 때는 area 로 지금 어느 메뉴에 있는지 알려 준다. 각 영역의 layout.tsx 가 넘겨 준다.
type HeaderProps = { variant: "start" } | { variant: "onboarding" } | { variant: "app"; area: AppArea };

export function Header(props: HeaderProps) {
  return (
    <header className={styles.header}>
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
          <Link className={styles.headerLink} href={routes.library}>
            저장하고 나중에 하기
          </Link>
        )}
        {props.variant === "app" && (
          // TODO: 로그인(FE-04)을 만들면 사용자 이름 첫 글자와 계정 메뉴를 붙인다. 지금은 디자인의 예시 글자.
          <button type="button" className={styles.avatar} aria-label="계정 메뉴">
            김
          </button>
        )}
      </div>
    </header>
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
