"use client";

// 온보딩 화면의 "아직 저장하지 않은 변경"을 머리글과 이어 준다.
// S02 는 바꾼 것을 "다음" 버튼에서 한 번에 저장한다 (FE 결정 2026-10-26). 그래서 머리글의 "저장하고 나중에 하기"도
// 떠나기 전에 그 화면의 저장을 불러야 한다. 화면은 useRegisterSave 로 저장 함수를 맡겨 두고, 머리글 링크(SaveLaterLink)가 꺼내 쓴다.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, type ComponentProps, type RefObject } from "react";

// 저장 함수: 성공하면 true (이동해도 됨), 실패하면 false (화면이 오류를 보여 주고 머문다)
type Save = () => Promise<boolean>;

const PendingSaveContext = createContext<RefObject<Save | null> | null>(null);

export function PendingSaveProvider({ children }: { children: React.ReactNode }) {
  const saveRef = useRef<Save | null>(null);
  return <PendingSaveContext value={saveRef}>{children}</PendingSaveContext>;
}

// 화면이 열려 있는 동안 저장 함수를 맡겨 둔다. 화면을 떠나면 비운다
export function useRegisterSave(save: Save) {
  const slotRef = use(PendingSaveContext);
  // 매번 새로 만들어지는 함수라 ref 로 최신 것을 가리킨다
  const latestRef = useRef(save);
  useEffect(() => {
    latestRef.current = save;
  });
  useEffect(() => {
    if (!slotRef) return;
    slotRef.current = () => latestRef.current();
    return () => {
      slotRef.current = null;
    };
  }, [slotRef]);
}

// 저장할 것이 있으면 저장한 뒤 이동하는 링크. 맡겨 둔 저장 함수가 없으면 보통 링크처럼 움직인다
export function SaveLaterLink({ href, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const slotRef = use(PendingSaveContext);
  const router = useRouter();
  return (
    <Link
      href={href}
      {...rest}
      onClick={async (event) => {
        const save = slotRef?.current;
        if (!save) return;
        event.preventDefault();
        if (await save()) router.push(href);
      }}
    />
  );
}
