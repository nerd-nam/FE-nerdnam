"use client";

// 본문 칸 + 글자 수. 값은 ProjectEditor 가 들고 있다.
import { Textarea } from "@/shared/ui/Field";
import { cx } from "@/shared/ui/cx";
import styles from "./Project.module.css";

// 글자 수 (공백 제외, 디자인 project.js 와 같은 방식)
function countChars(text: string) {
  return text.replace(/\s/g, "").length;
}

export function RawTextField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string | null }) {
  return (
    <div>
      <div className={cx(styles.row, styles.between)}>
        <label htmlFor="raw-text" className={styles.label}>
          무슨 일이 있었나요?
        </label>
        {/* aria-live: 글자 수가 바뀌면 스크린리더가 조용히 알려 준다 */}
        <span className={styles.meta} aria-live="polite">
          {countChars(value)}자 · 200자 이상 권장
        </span>
      </div>
      <Textarea
        id="raw-text"
        rows={9}
        value={value}
        invalid={!!error}
        aria-describedby={error ? "raw-text-error" : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p id="raw-text-error" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
