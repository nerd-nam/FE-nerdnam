import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";
import styles from "./StateCard.module.css";

type StateCardProps = {
  // wait: 기다리는 중 (도는 아이콘) / bad: 실패
  tone: "wait" | "bad";
  title: ReactNode;
  children: ReactNode; // 설명 글, 버튼
};

// AI 작업 상태 상자: S08 분석 중·실패, S09 탭 만드는 중·실패
// 기다리는 중은 role="status"(바뀌면 조용히 읽어 줌), 실패는 role="alert"(바로 읽어 줌)
export function StateCard({ tone, title, children }: StateCardProps) {
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={cx(styles.card, styles[tone])}>
      <p className={styles.title}>
        {tone === "bad" ? <Icon name="alert" /> : <Icon name="refresh" className={styles.spin} />}
        {title}
      </p>
      {children}
    </div>
  );
}

export function StateText({ children }: { children: ReactNode }) {
  return <p className={styles.text}>{children}</p>;
}
