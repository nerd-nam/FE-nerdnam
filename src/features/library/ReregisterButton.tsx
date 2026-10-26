"use client";

// 확정한 프로젝트의 "수정": 재등록을 시작하기 전에 무슨 일이 생기는지 안내한다 (기획서 6장 S06, ADR-0002 Q6 재등록)
// "수정 시작" → 서버에 재등록 시작(POST /api/projects/{id}/reopen, 프로젝트가 초안으로) → S04.
// 화면에서 유일하게 클릭에 반응하는 부분이라 이것만 클라이언트 컴포넌트다.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/shared/api/client";
import { problemMessage } from "@/shared/api/problem";
import { routes } from "@/shared/routes";
import { Button } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Dialog } from "@/shared/ui/Dialog";

export function ReregisterButton({ projectId, title }: { projectId: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setError(null);
  }

  async function start() {
    setPending(true);
    setError(null);
    const { error } = await api.POST("/api/projects/{projectId}/reopen", { params: { path: { projectId: Number(projectId) } } });
    setPending(false);
    if (error) return setError(problemMessage(error, "수정을 시작하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
    router.push(routes.project(projectId));
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} aria-label={`${title} 수정`}>
        수정
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title="이 프로젝트를 다시 등록할까요?"
        actions={
          <>
            <Button onClick={close}>취소</Button>
            <Button variant="primary" disabled={pending} onClick={start}>
              {pending ? "시작하는 중…" : "수정 시작"}
            </Button>
          </>
        }
      >
        {error && (
          <Callout tone="bad" icon="alert" role="alert">
            {error}
          </Callout>
        )}
        확정한 프로젝트를 고치려면 원문 입력부터 사례 나누기, 확정까지 다시 거쳐요. 다시 확정하기 전까지는 지금 확정한 사례가 공고 매칭에 계속 쓰여요.
      </Dialog>
    </>
  );
}
