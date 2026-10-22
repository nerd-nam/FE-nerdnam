import type { ComponentProps } from "react";
import { cx } from "./cx";
import styles from "./Chip.module.css";

type ChipProps = {
  // default: 고르면 검게 / accent: 고르면 파랗게 / add: 점선 "추가" 칩 / added: 이미 추가됨(초록)
  variant?: "default" | "accent" | "add" | "added";
  size?: "sm" | "md";
  // 켜짐/꺼짐이 있는 칩이면 true·false 를 넘긴다. 스크린리더가 "선택됨"이라고 읽어 준다.
  pressed?: boolean;
};

// 눌러서 고르는 칩 (기술 선택, 필터 …)
export function Chip({ variant = "default", size = "md", pressed, className, type = "button", ...rest }: ChipProps & ComponentProps<"button">) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cx(styles.chip, variant !== "default" && styles[variant], size === "sm" && styles.sm, className)}
      {...rest}
    />
  );
}
