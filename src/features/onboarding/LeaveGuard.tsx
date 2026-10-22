"use client";

// 확정 전 검토 결과가 사라지는 곳으로 갈 때 경고 (기획서 v1.14 F2 "검토 결과 유지 규칙")
// mode="leave-review"     S05 에서: S04(원문 화면)나 온보딩 밖으로 가면 경고. S02·S03 은 경고하지 않음
// mode="enter-original"   S02·S03 에서(검토 중에 온 경우): S04 로 갈 때만 경고. 그 밖으로 나가는 건 유지라 경고하지 않음
// - 경고가 뜨면 "나가기"를 눌러야 이동한다. 같은 화면 안 링크, 새 탭으로 여는 클릭은 경고하지 않는다
// - 머리글 링크는 공용 레이아웃에 있어서 링크마다 손댈 수 없으므로, 화면 전체의 클릭을 먼저(capture) 가로채서 본다
// - 브라우저 뒤로 가기·창 닫기는 여기서 막지 않는다. 그 경우는 다음에 S04 에 들어갈 때 서버가 버린다 (C-02 S05 확인할 것 8번)
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { routes } from "@/shared/routes";

// 이 경로로 가면 검토 결과가 유지된다 (S02 기술스택, S03 경력)
const KEEP_PATHS: string[] = [routes.skills, routes.career];
// S04 프로젝트 입력(/projects/p_102, /projects/new). /projects/p_102/review(S05)는 아니다
const ORIGINAL_PATH = /^\/projects\/[^/]+$/;

type Mode = "leave-review" | "enter-original";

function shouldWarn(mode: Mode, pathname: string) {
  if (mode === "enter-original") return ORIGINAL_PATH.test(pathname);
  return !KEEP_PATHS.includes(pathname);
}

export function LeaveGuard({ active, mode }: { active: boolean; mode: Mode }) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    function onClick(event: MouseEvent) {
      // 새 탭·새 창으로 여는 클릭은 지금 화면을 떠나지 않는다
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest("a[href]");
      if (!link || link.hasAttribute("data-allow-leave")) return;

      const url = new URL(link.getAttribute("href")!, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;
      if (!shouldWarn(mode, url.pathname)) return;

      // 이동을 멈추고 경고를 띄운다. Next.js 의 Link 는 이미 막힌(defaultPrevented) 클릭이면 이동하지 않는다
      event.preventDefault();
      setPendingHref(url.pathname + url.search + url.hash);
    }

    document.addEventListener("click", onClick, true); // true = 다른 처리보다 먼저(capture)
    return () => document.removeEventListener("click", onClick, true); // 화면을 떠나면 정리
  }, [active, mode]);

  return (
    <Dialog
      open={pendingHref !== null}
      onClose={() => setPendingHref(null)}
      title="지금 나가면 검토한 내용이 사라져요"
      actions={
        <>
          <Button onClick={() => setPendingHref(null)}>계속 검토하기</Button>
          <Button
            variant="danger"
            onClick={() => {
              // TODO(④): 서버에 "검토 결과 버리기" 요청 (C-02 S04 확인할 것 6번)
              const href = pendingHref!;
              setPendingHref(null);
              router.push(href);
            }}
          >
            나가기
          </Button>
        </>
      }
    >
      프로젝트를 확정하지 않으면 사례별 결정과 확인 질문 답변이 저장되지 않아요. 다시 보려면 원문 화면에서 재구성을 다시 해야 해요.
    </Dialog>
  );
}
