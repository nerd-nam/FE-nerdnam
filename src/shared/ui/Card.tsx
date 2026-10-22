import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import styles from "./Card.module.css";

type CardProps = {
  tone?: "default" | "dashed" | "sunken" | "warn" | "bad" | "dark";
  size?: "sm" | "md" | "lg";
  as?: "section" | "div" | "article";
} & Omit<ComponentProps<"section">, "ref">; // ref 는 태그(section/div/article)마다 타입이 달라 받지 않는다

// 흰 바탕 상자. 화면의 내용 묶음마다 쓴다.
export function Card({ tone = "default", size = "md", as: Tag = "section", className, ...rest }: CardProps) {
  return (
    <Tag
      className={cx(styles.card, tone !== "default" && styles[tone], size !== "md" && styles[size], className)}
      {...rest}
    />
  );
}

// 카드 제목. id 를 주고 Card 에 aria-labelledby 로 연결하면 스크린리더가 구역 이름으로 읽는다.
export function CardTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className={styles.title}>
      {children}
    </h2>
  );
}

export function CardDesc({ children }: { children: ReactNode }) {
  return <p className={styles.desc}>{children}</p>;
}
