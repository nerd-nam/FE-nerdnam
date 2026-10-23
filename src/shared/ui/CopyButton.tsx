"use client";

// 복사 버튼: 누르면 글을 클립보드에 넣고, 잠깐 "복사됨"으로 바뀐다. 서버를 부르지 않는다 (C-02 S09 "복사 버튼은 웹에서만").
// S09 구성 복사, (FE-15) 프롬프트 복사에서 쓴다.
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 화면을 떠나면 남은 타이머를 정리한다
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // 브라우저가 막으면(권한 없음 등) 아무것도 바꾸지 않는다
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button size="sm" onClick={copy}>
      <Icon name={copied ? "check" : "copy"} size="sm" />
      {/* aria-live: 글자가 "복사됨"으로 바뀌면 스크린리더가 읽어 준다 */}
      <span aria-live="polite">{copied ? "복사됨" : label}</span>
    </Button>
  );
}
