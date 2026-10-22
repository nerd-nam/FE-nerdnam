import type { ComponentProps } from "react";
import { cx } from "./cx";
import styles from "./Table.module.css";

// 표. 안의 <thead>, <tr>, <th>, <td> 는 일반 HTML 태그를 그대로 쓴다.
// 모바일에서 표가 화면보다 넓으면 표만 옆으로 스크롤되도록 바깥을 한 번 감싼다.
export function Table({ variant = "default", className, ...rest }: { variant?: "default" | "boxed" | "plain" } & ComponentProps<"table">) {
  return (
    <div className={styles.wrap}>
      <table className={cx(styles.table, variant !== "default" && styles[variant], className)} {...rest} />
    </div>
  );
}
