"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./Dialog.module.css";

type DialogProps = {
  open: boolean;
  onClose: () => void; // Esc 키, 바깥 클릭, 닫기 버튼 모두 여기로 온다
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode; // 아래쪽 버튼들
};

// 확인 대화상자 (예: "다시 나누면 모든 사례의 결정이 초기화돼요")
// 브라우저 기본 <dialog> 를 써서 Esc 로 닫기, 뒤쪽 화면 클릭 막기, 키보드 포커스 가두기를 따로 만들 필요가 없다.
export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // open 값이 바뀔 때마다 실제 <dialog> 를 열고 닫는다.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={styles.dialog}
      onClose={onClose}
      // 상자 바깥(어두운 배경)을 누르면 닫는다. 배경을 누르면 event.target 이 <dialog> 자신이다.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className={styles.box}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children && <div className={styles.body}>{children}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </dialog>
  );
}
