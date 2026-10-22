import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";
import styles from "./Callout.module.css";

type CalloutProps = {
  tone: "warn" | "bad" | "muted" | "sunken";
  icon?: IconName;
  // 오류처럼 바로 알려야 하는 내용이면 "alert" 를 넘긴다. 스크린리더가 나타나자마자 읽어 준다.
  role?: "alert" | "status";
  id?: string;
  children: ReactNode;
};

// 눈에 띄는 안내 상자 (경고, 오류 요약, 개인정보 안내 …)
export function Callout({ tone, icon, role, id, children }: CalloutProps) {
  return (
    <div id={id} role={role} className={cx(styles.callout, styles[tone])}>
      {icon && <Icon name={icon} />}
      <div>{children}</div>
    </div>
  );
}

// 작은 회색 안내 한 줄
export function Note({ icon = "info", children }: { icon?: IconName; children: ReactNode }) {
  return (
    <p className={styles.note}>
      <Icon name={icon} />
      <span>{children}</span>
    </p>
  );
}
