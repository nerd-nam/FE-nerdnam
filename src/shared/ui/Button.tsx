import Link from "next/link";
import type { ComponentProps } from "react";
import { cx } from "./cx";
import styles from "./Button.module.css";

type Variant = "default" | "primary" | "ghost" | "danger" | "text";
type Size = "sm" | "md" | "lg";

type StyleProps = {
  variant?: Variant;
  size?: Size;
  block?: boolean; // 가로 폭을 꽉 채움
};

// 버튼 모양 클래스. <button>·<a> 가 아닌 태그를 버튼처럼 보이게 할 때도 쓴다 (예: 파일 선택 <label>)
export function buttonClass({ variant = "default", size = "md", block }: StyleProps, className?: string) {
  return cx(
    styles.btn,
    variant !== "default" && styles[variant],
    size !== "md" && styles[size],
    block && styles.block,
    className,
  );
}

// 동작을 하는 버튼 (저장, 확정, 삭제 …)
// ComponentProps<"button"> = <button> 태그가 받는 모든 속성(onClick, disabled, type …)을 그대로 받는다는 뜻.
export function Button({ variant, size, block, className, type = "button", ...rest }: StyleProps & ComponentProps<"button">) {
  return <button type={type} className={buttonClass({ variant, size, block }, className)} {...rest} />;
}

// 다른 화면으로 이동하는, 버튼처럼 생긴 링크 ("다음", "이메일로 시작하기" …)
// 이동은 <a>(Link), 동작은 <button> 으로 구분해야 키보드·스크린리더 사용자가 헷갈리지 않는다.
export function ButtonLink({ variant, size, block, className, ...rest }: StyleProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClass({ variant, size, block }, className)} {...rest} />;
}

// 아이콘만 있는 버튼. 글자가 없으니 label(스크린리더용 이름)이 반드시 필요하다.
export function IconButton({ label, className, type = "button", ...rest }: { label: string } & ComponentProps<"button">) {
  return <button type={type} aria-label={label} className={cx(styles.iconBtn, className)} {...rest} />;
}
