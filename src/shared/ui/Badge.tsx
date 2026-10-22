import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";
import styles from "./Badge.module.css";

// 상태 배지: "작성 중", "확정", "확인 필요" …
export function Badge({ tone, children }: { tone: "ok" | "warn" | "bad" | "info" | "muted"; children: ReactNode }) {
  return <span className={cx(styles.badge, styles[tone])}>{children}</span>;
}

// 정보 태그: 기술명, 기간 …
export function Tag({ variant = "default", children }: { variant?: "default" | "flat" | "accent"; children: ReactNode }) {
  return (
    <span className={cx(styles.tag, variant === "flat" && styles.tagFlat, variant === "accent" && styles.tagAccent)}>
      {children}
    </span>
  );
}

// 개수 표시: 탭 옆 "3" 같은 것
export function Count({ dark, children }: { dark?: boolean; children: ReactNode }) {
  return <span className={cx(styles.count, dark && styles.countDark)}>{children}</span>;
}

// 요건 판정 배지. 색만으로 구분하면 색약 사용자가 알아보기 어려워서 아이콘 + 글자를 같이 쓴다.
// 값 이름(met/partial/unmet)은 임시다. web-api 계약이 정해지면 계약의 값으로 맞춘다.
export type Verdict = "met" | "partial" | "unmet";

const VERDICT_VIEW = {
  met: { label: "충족", icon: <Icon name="check" size="sm" bold /> },
  partial: { label: "부분 충족", icon: <Icon name="half" size="sm" /> },
  unmet: { label: "미충족", icon: <Icon name="x" size="sm" bold /> },
} satisfies Record<Verdict, { label: string; icon: ReactNode }>;

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const view = VERDICT_VIEW[verdict];
  return (
    <span className={cx(styles.verdict, styles[verdict])}>
      {view.icon}
      {view.label}
    </span>
  );
}
