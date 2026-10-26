"use client";

// 화면을 떠날 때 자동 저장 (S04, FE 결정 2026-10-26 "떠날 때만 자동").
// 저장할 것이 있으면(dirty) 이 화면 밖으로 가는 우리 사이트 링크를 누를 때 먼저 save() 를 부르고, 성공하면 이동한다.
// 머리글·단계 표시·탭처럼 이 화면 코드 밖에 있는 링크도 잡으려고, 화면 전체의 클릭을 먼저(capture) 본다 (LeaveGuard 와 같은 방식).
// 저장에 실패하면 이동하지 않는다(화면이 오류를 보여 준다). 새로고침·탭 닫기는 저장할 수 없어서 브라우저가 경고만 한다.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function useSaveOnLeave(dirty: boolean, save: () => Promise<boolean>) {
  const router = useRouter();
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    if (!dirty) return;

    async function onClick(event: MouseEvent) {
      // 새 탭·새 창으로 여는 클릭은 지금 화면을 떠나지 않는다
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest("a[href]");
      if (!link || link.getAttribute("target") === "_blank") return;
      const url = new URL(link.getAttribute("href")!, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return; // 다른 사이트, 같은 화면 안 링크
      event.preventDefault();
      event.stopPropagation(); // 링크의 기본 이동(Next.js Link 포함)을 막는다
      if (await saveRef.current()) router.push(url.pathname + url.search + url.hash);
    }
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty, router]);
}
