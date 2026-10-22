"use client";

// 본문 칸 + 글자 수. 글을 쓸 때마다 글자 수가 바뀌어야 해서 클라이언트 컴포넌트다.
import { useState } from "react";
import { Textarea } from "@/shared/ui/Field";
import { cx } from "@/shared/ui/cx";
import styles from "./Project.module.css";

// 글자 수 (공백 제외, 디자인 project.js 와 같은 방식)
function countChars(text: string) {
  return text.replace(/\s/g, "").length;
}

export function RawTextField({ initialText }: { initialText: string }) {
  // useState: 화면이 기억하는 값. text 는 지금 값, setText 로 바꾸면 화면이 다시 그려진다.
  const [text, setText] = useState(initialText);

  return (
    <div>
      <div className={cx(styles.row, styles.between)}>
        <label htmlFor="raw-text" className={styles.label}>
          무슨 일이 있었나요?
        </label>
        {/* aria-live: 글자 수가 바뀌면 스크린리더가 조용히 알려 준다 */}
        <span className={styles.meta} aria-live="polite">
          {countChars(text)}자 · 200자 이상 권장
        </span>
      </div>
      <Textarea
        id="raw-text"
        name="rawText"
        rows={9}
        value={text}
        // 글자를 칠 때마다 불린다. event.target.value 가 방금 바뀐 본문 전체다.
        onChange={(event) => setText(event.target.value)}
      />
    </div>
  );
}
