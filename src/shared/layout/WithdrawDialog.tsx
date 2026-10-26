"use client";

// 탈퇴 확인창. 머리글 계정 메뉴와 약관 동의 화면(S01-2)에서 같이 쓴다 (기획서 8장: 탈퇴하면 원본·벡터 즉시 삭제)
import { useState } from "react";
import { withdraw } from "@/shared/api/account";
import { Button } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Dialog } from "@/shared/ui/Dialog";

export function WithdrawDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    onClose();
  }

  async function confirm() {
    setPending(true);
    setError(null);
    const message = await withdraw(); // 성공하면 S01 로 페이지가 바뀐다
    setPending(false);
    setError(message);
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="탈퇴할까요?"
      actions={
        <>
          <Button onClick={close}>취소</Button>
          <Button variant="danger" disabled={pending} onClick={confirm}>
            {pending ? "탈퇴하는 중…" : "탈퇴"}
          </Button>
        </>
      }
    >
      {error && (
        <Callout tone="bad" icon="alert" role="alert">
          {error}
        </Callout>
      )}
      <p>기술스택·경력·프로젝트와 사례, 공고·리포트·작성 방향이 모두 바로 삭제되고 되돌릴 수 없어요.</p>
    </Dialog>
  );
}
