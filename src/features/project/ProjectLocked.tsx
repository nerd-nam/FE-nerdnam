"use client";

// S04 에서 원문을 바로 고칠 수 없는 프로젝트를 열었을 때 양식 대신 보이는 안내 카드 (FE 결정 2026-10-26, C-02 S04 확인할 것 6·10)
// - 검토 중: 검토 결과가 남아 있다. "검토로 돌아가기"(S05) / "검토 결과 버리고 원문 고치기"(POST /review/discard → 양식)
//   실수로 탭을 눌러 검토 결과를 잃지 않게, 버리기는 사용자가 고를 때만 한다 (기획서 v1.14 검토 결과 유지 규칙)
// - 확정: "보기"(S05 읽기 모드) / "수정"(재등록 시작 안내창, S06 과 같은 버튼)
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ReregisterButton } from "@/features/library/ReregisterButton";
import { api } from "@/shared/api/client";
import { problemMessage } from "@/shared/api/problem";
import { routes } from "@/shared/routes";
import { Badge } from "@/shared/ui/Badge";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { DeleteProjectButton } from "./DeleteProjectButton";
import styles from "./Project.module.css";

type ProjectLockedProps = { projectId: number; title: string; status: "review" | "confirmed" };

export function ProjectLocked({ projectId, title, status }: ProjectLockedProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = String(projectId);

  async function discard() {
    setPending(true);
    setError(null);
    const { error } = await api.POST("/api/projects/{projectId}/review/discard", { params: { path: { projectId } } });
    setPending(false);
    if (error) return setError(problemMessage(error, "검토 결과를 정리하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
    router.refresh(); // 초안이 되었으니 이 화면을 서버에서 다시 그리면 양식이 나온다
  }

  return (
    <Card size="lg" aria-labelledby="locked-title" className={styles.skills}>
      {status === "review" ? (
        <>
          <Badge tone="info">검토 중</Badge>
          <h2 id="locked-title" className={styles.guideTitle}>
            &lsquo;{title || "제목 없는 프로젝트"}&rsquo;는 검토 중이에요
          </h2>
          <p className={styles.muted}>
            AI가 나눈 사례를 검토하고 있어요. 원문을 고치려면 지금 검토 결과(사례별 결정과 확인 질문 답변)를 버리고 다시 나눠야 해요.
          </p>
          {error && (
            <Callout tone="bad" icon="alert" role="alert">
              {error}
            </Callout>
          )}
          <div className={styles.lockedActions}>
            <ButtonLink variant="primary" href={routes.review(id)}>
              검토로 돌아가기
            </ButtonLink>
            <Button disabled={pending} onClick={discard}>
              {pending ? "정리하는 중…" : "검토 결과 버리고 원문 고치기"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <Badge tone="ok">확정</Badge>
          <h2 id="locked-title" className={styles.guideTitle}>
            &lsquo;{title || "제목 없는 프로젝트"}&rsquo;는 확정한 프로젝트예요
          </h2>
          <p className={styles.muted}>확정한 사례가 공고 매칭에 쓰이고 있어요. 고치려면 수정을 시작해 원문부터 다시 거쳐요.</p>
          <div className={styles.lockedActions}>
            <ButtonLink href={routes.review(id)}>보기</ButtonLink>
            <ReregisterButton projectId={id} title={title} />
          </div>
        </>
      )}
      <div className={styles.formFoot}>
        <DeleteProjectButton projectId={projectId} title={title} status={status} />
      </div>
    </Card>
  );
}
