import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";
import styles from "./Field.module.css";

type FieldProps = {
  id: string; // 안에 들어갈 입력칸의 id. 라벨·오류 메시지를 이 입력칸과 연결하는 데 쓴다.
  label: ReactNode;
  hint?: ReactNode; // 라벨 옆 흐린 글씨. 예: "(최대 5줄)"
  required?: boolean;
  help?: ReactNode; // 입력칸 아래 안내
  error?: ReactNode; // 입력칸 아래 빨간 오류 메시지
  children: ReactNode;
};

// 라벨 + 입력칸 + 안내/오류를 한 묶음으로 보여 준다.
// 입력칸 쪽에는 invalid={!!error} 와 aria-describedby={fieldErrorId(id)} 를 넘겨 주면
// 스크린리더가 입력칸에 들어갔을 때 오류 메시지를 함께 읽어 준다.
export function Field({ id, label, hint, required, help, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.req} aria-label="필수">
            *
          </span>
        )}
        {hint && <span className={styles.hint}> {hint}</span>}
      </label>
      {children}
      {help && !error && (
        <p className={styles.help}>
          <Icon name="info" />
          <span>{help}</span>
        </p>
      )}
      {error && (
        <p id={fieldErrorId(id)} className={styles.err}>
          {error}
        </p>
      )}
    </div>
  );
}

export function fieldErrorId(id: string) {
  return `${id}-error`;
}

type InvalidProp = { invalid?: boolean };

export function Input({ invalid, className, ...rest }: InvalidProp & ComponentProps<"input">) {
  return <input aria-invalid={invalid || undefined} className={cx(styles.input, className)} {...rest} />;
}

export function Textarea({ invalid, className, ...rest }: InvalidProp & ComponentProps<"textarea">) {
  return <textarea aria-invalid={invalid || undefined} className={cx(styles.input, styles.textarea, className)} {...rest} />;
}

// 체크박스 + 글자. 글자를 눌러도 체크되도록 <label> 로 감싼다.
export function Checkbox({ children, className, ...rest }: { children: ReactNode } & Omit<ComponentProps<"input">, "type">) {
  return (
    <label className={cx(styles.check, className)}>
      <input type="checkbox" {...rest} />
      <span>{children}</span>
    </label>
  );
}
