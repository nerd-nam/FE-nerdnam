"use client";

// S04 "프로젝트 삭제". 어떤 상태든 지울 수 있다 (C-02 S04 확인할 것 7, 2026-10-23 결정).
// - 확정한 프로젝트는 더 크게 경고한다: 확정 사례가 공고 매칭에서 빠지고, 이전 리포트의 근거는 "삭제된 경험"으로 보인다
// - 되돌릴 수 없어서 확인창을 거친다
// ④ 에서 붙일 것: 삭제 요청(프로젝트·사례·검색용 데이터 삭제, BE). 지금은 확인 후 내 경험(S06)으로 이동만 한다.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { routes } from "@/shared/routes";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import type { ProjectStatus } from "./mock";

type DeleteProjectButtonProps = { title: string; status: ProjectStatus };

export function DeleteProjectButton({ title, status }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const name = title.trim() || "제목 없는 프로젝트";

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        프로젝트 삭제
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`'${name}' 프로젝트를 삭제할까요?`}
        actions={
          <>
            <Button onClick={() => setOpen(false)}>취소</Button>
            <Button
              variant="danger"
              onClick={() => {
                setOpen(false);
                // TODO(④): 서버에 삭제 요청. 지금은 임시 데이터라 실제로 지우지 않고 내 경험으로만 간다
                router.push(routes.library);
              }}
            >
              삭제
            </Button>
          </>
        }
      >
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
