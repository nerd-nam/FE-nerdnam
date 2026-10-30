"use client";

// S04 "프로젝트 삭제". 어떤 상태든 지울 수 있다 (C-02 S04 확인할 것 7, 2026-10-23 결정).
// - 확정한 프로젝트는 더 크게 경고한다: 확정 사례가 공고 매칭에서 빠지고, 이전 리포트의 근거는 "삭제된 경험"으로 보인다
// - 되돌릴 수 없어서 확인창을 거친다 → DELETE /api/projects/{id} → 내 경험(S06)
// - 재구성이 돌고 있으면 서버가 409(AI_JOB_RUNNING)로 거부한다 → 서버 문장을 확인창 안에 보여 준다 (확인할 것 9)
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/shared/api/client";
import { problemMessage } from "@/shared/api/problem";
import { routes } from "@/shared/routes";
import { Button } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Dialog } from "@/shared/ui/Dialog";
import type { ProjectStatus } from "./project";

type DeleteProjectButtonProps = {
  projectId: number;
  title: string;
  status: ProjectStatus;
  onDeleted?: () => void; // 지우기 직전에 알림 (떠날 때 저장을 끄려고)
};

export function DeleteProjectButton({ projectId, title, status, onDeleted }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = title.trim() || "제목 없는 프로젝트";

  function close() {
    setOpen(false);
    setError(null);
  }

  async function remove() {
    setPending(true);
    setError(null);
    const { error, response } = await api.DELETE("/api/projects/{projectId}", { params: { path: { projectId } } });
    setPending(false);
    if (error && response.status !== 404) {
      return setError(
        response.status === 409
          ? problemMessage(error, "방금 요청한 재구성이 끝난 뒤에 지울 수 있어요.")
          : problemMessage(error, "프로젝트를 삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요."),
      );
    }
    onDeleted?.();
    // 이 화면은 떠나도 숨겨져 남는다(cacheComponents). 확인창을 닫고 가야 뒤로 가기로 돌아왔을 때 열린 채로 있지 않다
    close();
    router.push(routes.library);
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        프로젝트 삭제
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={`'${name}' 프로젝트를 삭제할까요?`}
        actions={
          <>
            <Button onClick={close}>취소</Button>
            <Button variant="danger" disabled={pending} onClick={remove}>
              {pending ? "삭제하는 중…" : "삭제"}
            </Button>
          </>
        }
      >
        {error && (
          <Callout tone="bad" icon="alert" role="alert">
            {error}
          </Callout>
        )}
        <p>적은 원문과 사례가 모두 지워지고, 되돌릴 수 없어요.</p>
        {status === "confirmed" && (
          <p>
            <strong>확정한 프로젝트예요.</strong> 이 프로젝트의 사례는 더 이상 공고 매칭에 쓰이지 않고, 이전에 받은 리포트의 근거에는
            &lsquo;삭제된 경험&rsquo;으로 보여요.
          </p>
        )}
      </Dialog>
    </>
  );
}
