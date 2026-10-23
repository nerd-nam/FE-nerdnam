"use client";

// "화면이 다시 그려진 다음에 이 id 의 요소로 커서(포커스)를 옮겨 줘" (FE-16 접근성 점검)
// 무언가를 지우면 그것을 누른 버튼도 함께 사라져서 포커스가 화면 맨 위(body)로 튄다.
// 키보드 사용자는 다시 처음부터 Tab 을 눌러야 하므로, 지운 자리 근처(다음 항목 등)로 옮겨 준다.
//   const focusAfter = useFocusAfterRender();
//   focusAfter("skill-del-2"); setSkills(...);   → 다시 그려진 뒤 id="skill-del-2" 에 포커스
import { useEffect, useRef } from "react";

export function useFocusAfterRender() {
  const target = useRef<string | null>(null);

  // 의존성 없이 매번 그린 뒤 실행되지만, 옮길 대상이 있을 때만 일한다
  useEffect(() => {
    if (!target.current) return;
    document.getElementById(target.current)?.focus();
    target.current = null;
  });

  return (id: string) => {
    target.current = id;
  };
}
