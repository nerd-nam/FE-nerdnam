"use client";

// S10 공고 목록 · 작업: FE-18 (디자인 design/apply.html, C-02 S10)
// 공고마다 카드 한 장: 상태 배지 · 회사 · 날짜 · 포지션 · (완료면) 충족 수 · 상태에 맞는 버튼 · 삭제.
// 삭제하면 목록에서 빠져야 해서 목록을 여기서 들고 있는 클라이언트 컴포넌트다.
// ④ 에서 붙일 것: 삭제 요청(BE 공고 삭제 API). 지금은 화면 목록에서만 뺀다.
import { useState } from "react";
import { NEW_JD_ID, routes } from "@/shared/routes";
import { Badge } from "@/shared/ui/Badge";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Dialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { useFocusAfterRender } from "@/shared/useFocusAfterRender";
import type { PostingStatus, PostingSummary } from "./mock";
import styles from "./Apply.module.css";

// 상태별 배지와 날짜 뒤에 붙는 말
const STATUS_VIEW = {
  done: { tone: "ok", label: "분석 완료", dateSuffix: "분석" },
  analyzing: { tone: "info", label: "분석 중", dateSuffix: "분석 시작" },
  failed: { tone: "bad", label: "분석 실패", dateSuffix: "분석 시도" },
  draft: { tone: "warn", label: "작성 중", dateSuffix: "수정" },
} as const satisfies Record<PostingStatus, { tone: "ok" | "info" | "bad" | "warn"; label: string; dateSuffix: string }>;

export function PostingList({ initialPostings }: { initialPostings: PostingSummary[] }) {
  const [postings, setPostings] = useState(initialPostings);
  const [deleting, setDeleting] = useState<PostingSummary | null>(null); // 삭제 확인창에 띄운 공고
  const focusAfter = useFocusAfterRender();

  if (postings.length === 0) {
    return (
      <Card tone="dashed" aria-labelledby="empty-title" className={styles.empty}>
        <h2 id="empty-title" className={styles.emptyTitle}>
          아직 공고가 없어요
        </h2>
        <p className={styles.emptyDesc}>
          지원할 공고의 필수·우대사항을 옮겨 적으면, 내 경험으로 적합도를 보고 작성 방향을 받을 수 있어요.
        </p>
        <ButtonLink id="first-posting" variant="primary" href={routes.jd(NEW_JD_ID)}>
          <Icon name="plus" />첫 공고 입력하기
        </ButtonLink>
      </Card>
    );
  }

  return (
    <>
      <ul className={styles.list} aria-label="공고 목록">
        {postings.map((p, index) => {
          const view = STATUS_VIEW[p.status];
          return (
            <li key={p.jdId}>
              {/* 작성 중(아직 분석 전)은 디자인처럼 점선 카드 */}
              <Card as="article" tone={p.status === "draft" ? "dashed" : "default"} className={styles.card}>
                <div className={styles.top}>
                  <div className={styles.text}>
                    <div className={styles.metaRow}>
                      <Badge tone={view.tone}>
                        {p.status === "done" && <Icon name="check" size="sm" bold />}
                        {p.status === "failed" && <Icon name="alert" size="sm" />}
                        {view.label}
                      </Badge>
                      <span className={styles.meta}>
                        {p.company} · {p.date} {view.dateSuffix}
                      </span>
                    </div>
                    <h2 className={styles.position}>{p.position}</h2>
                    {p.counts && (
                      <p className={styles.counts}>
                        필수{" "}
                        <strong>
                          {p.counts.requiredMet} / {p.counts.requiredTotal}
                        </strong>{" "}
                        충족 · 우대{" "}
                        <strong>
                          {p.counts.preferredMet} / {p.counts.preferredTotal}
                        </strong>{" "}
                        충족{p.counts.preferredPartial > 0 && ` · 부분 ${p.counts.preferredPartial}`}
                      </p>
                    )}
                  </div>
                  <Button id={`posting-del-${index}`} variant="ghost" size="sm" aria-label={`${p.company} ${p.position} 공고 삭제`} onClick={() => setDeleting(p)}>
                    삭제
                  </Button>
                </div>
                <div className={styles.actions}>
                  <PostingActions posting={p} />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="이 공고를 삭제할까요?"
        actions={
          <>
            <Button onClick={() => setDeleting(null)}>취소</Button>
            <Button
              variant="danger"
              onClick={() => {
                // TODO(④): 서버에 공고 삭제 요청. 지금은 화면 목록에서만 뺀다
                // 지운 뒤 다음 카드(마지막이었으면 윗 카드)의 삭제 버튼으로, 다 지웠으면 "첫 공고 입력하기"로 커서를 옮긴다 (FE-16)
                const index = postings.findIndex((p) => p.jdId === deleting?.jdId);
                const left = postings.length - 1;
                focusAfter(left === 0 ? "first-posting" : `posting-del-${Math.min(index, left - 1)}`);
                setPostings((prev) => prev.filter((p) => p.jdId !== deleting?.jdId));
                setDeleting(null);
              }}
            >
              삭제
            </Button>
          </>
        }
      >
        <p>
          <strong>
            {deleting?.company} · {deleting?.position}
          </strong>
        </p>
        <p>공고와 적합도 리포트(분석 기록 포함), 작성 방향이 함께 지워지고 되돌릴 수 없어요. 내 경험은 지워지지 않아요.</p>
      </Dialog>
    </>
  );
}

// 상태에 맞는 이동 (C-02 S10): 작성 중 → S07 / 분석 중·실패 → S08 / 완료 → S08 리포트·S09 작성 방향
function PostingActions({ posting }: { posting: PostingSummary }) {
  switch (posting.status) {
    case "draft":
      return (
        <ButtonLink size="sm" href={routes.jd(posting.jdId)}>
          이어서 작성하기 <Icon name="arrow" size="sm" />
        </ButtonLink>
      );
    case "analyzing":
      return (
        <ButtonLink size="sm" href={routes.report(posting.jdId)}>
          진행 상황 보기
        </ButtonLink>
      );
    case "failed":
      return (
        <ButtonLink size="sm" href={routes.report(posting.jdId)}>
          다시 시도하기
        </ButtonLink>
      );
    case "done":
      return (
        <>
          <ButtonLink size="sm" href={routes.report(posting.jdId)}>
            리포트
          </ButtonLink>
          <ButtonLink variant="primary" size="sm" href={routes.guide(posting.jdId, "motive")}>
            작성 방향 <Icon name="arrow" size="sm" />
          </ButtonLink>
        </>
      );
  }
}
