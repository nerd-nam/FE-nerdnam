"use client";

// 브라우저 뒤로 가기·앞으로 가기로 화면에 돌아오면 서버에서 다시 그린다.
// Next.js(cacheComponents)는 떠난 화면을 지우지 않고 숨겨 두었다가, 뒤로 가기를 하면 서버에 묻지 않고 그대로 다시 보여 준다.
// 그사이 다른 화면에서 저장·삭제한 것이 있으면 예전 내용이 보이므로, 돌아온 다음에 서버에 다시 묻는다.
// 링크·router.push 로 오는 이동은 Next.js 가 원래 서버에 다시 묻는다. 그래서 popstate(뒤로·앞으로 가기)만 잡는다.
// 화면 부품은 서버 데이터로 만든 key(shared/dataKey)를 달아서, 다시 받은 데이터가 바뀌었을 때만 새로 만들어진다.
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RefreshOnHistory() {
  const router = useRouter();
  useEffect(() => {
    // Next.js 가 돌아간 화면을 먼저 꺼낸 뒤에 다시 그리도록 한 박자 늦춘다
    const onPopState = () => setTimeout(() => router.refresh());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [router]);
  return null;
}
