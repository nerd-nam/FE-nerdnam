"use client";

// 머리글 계정 메뉴 (앱 화면 S06~S10). 디자인에 메뉴 내용이 없어 우리가 정했다 (C-02 공통 확인할 것 4, design/assets/js/common.js)
// - 동그라미(이름 첫 글자)를 누르면 아래로 작은 상자가 열린다: 이름·이메일, 로그아웃, 탈퇴하기
// - 로그아웃: POST /api/auth/logout → S01 / 탈퇴하기: 확인창 → DELETE /api/me → S01
// - 닫기: 동그라미 다시 누르기, Esc(동그라미로 커서 돌아감), 상자 바깥 누르기, Tab 으로 상자 밖으로 나가기
// 메뉴 항목이 둘뿐이라 화살표 키로 움직이는 role="menu" 대신, 버튼으로 여닫는 "펼침 상자"로 만들었다(Tab 으로 항목 이동).
import { useEffect, useId, useRef, useState } from "react";
import { logout } from "@/shared/api/account";
import { Callout } from "@/shared/ui/Callout";
import styles from "./Layout.module.css";
import { WithdrawDialog } from "./WithdrawDialog";

type AccountMenuProps = { name: string | null; email: string | null };

export function AccountMenu({ name, email }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // 카카오는 이름·이메일을 안 줄 수도 있다. 그때는 글자 대신 "?"
  const label = name ?? email ?? "";
  const initial = label.trim().charAt(0).toUpperCase() || "?";

  function close() {
    setOpen(false);
    setError(null);
  }

  // 열려 있는 동안만: Esc 로 닫고 동그라미로 돌아가기, 바깥을 누르면 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      buttonRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  async function onLogout() {
    setPending(true);
    setError(null);
    const message = await logout(); // 성공하면 S01 로 페이지가 바뀐다
    setPending(false);
    setError(message);
  }

  return (
    <div
      ref={wrapRef}
      className={styles.account}
      // Tab 으로 상자 밖으로 나가면 닫는다 (다음 칸이 상자 안이면 그대로)
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.avatar}
        aria-label={label ? `${label} 계정 메뉴` : "계정 메뉴"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {initial}
      </button>

      <div id={panelId} className={styles.accountPanel} hidden={!open}>
        <div className={styles.accountWho}>
          <strong className={styles.accountName}>{name ?? "이름 없음"}</strong>
          {email && <span className={styles.accountEmail}>{email}</span>}
        </div>
        {error && (
          <Callout tone="bad" icon="alert" role="alert">
            {error}
          </Callout>
        )}
        <button type="button" className={styles.accountItem} disabled={pending} onClick={onLogout}>
          {pending ? "로그아웃하는 중…" : "로그아웃"}
        </button>
        <button
          type="button"
          className={`${styles.accountItem} ${styles.accountDanger}`}
          onClick={() => {
            close();
            setWithdrawing(true);
          }}
        >
          탈퇴하기
        </button>
      </div>

      <WithdrawDialog
        open={withdrawing}
        onClose={() => {
          setWithdrawing(false);
          buttonRef.current?.focus(); // 확인창을 닫으면 동그라미로 커서를 돌려준다
        }}
      />
    </div>
  );
}
