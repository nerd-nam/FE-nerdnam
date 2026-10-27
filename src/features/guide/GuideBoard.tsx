"use client";

// S09 의 움직이는 부분: 탭 생성 상태(만드는 중·완료·실패)와 "이 탭 다시 만들기", 방향 제시 평가.
// 다시 만들기를 누르면 왼쪽 내용이 "만드는 중" 상자로 바뀌어야 해서, 왼쪽(panel)과 오른쪽을 이 컴포넌트가 함께 그린다.
// 탭 내용(panel)과 근거 목록(sources)은 움직이지 않아서 서버에서 만들어 받아 그 자리에 놓기만 한다.
//
// 만들기·기다리기 (C-02 S09 확인할 것 1·2·4·7, FE 결정 2026-10-26):
// - 아직 만든 적 없는 탭을 열면 바로 만들기 시작한다(피드백 없이). 나머지 탭은 탭 줄(GuideTabs)이 함께 만든다
//   (FE 결정 2026-10-27: 다섯 탭을 한꺼번에). 이 탭의 상태가 바뀌면 탭 줄에 알린다(announceGuideStatus)
// - 만드는 중이면 작업 번호(runningJobId)로 2.5초마다 묻고(S04·S08 과 같음), 번호가 없으면 탭을 5초마다 다시 묻는다(S08 과 같음)
// - 끝나면 화면을 서버에서 다시 그려(router.refresh) 내용을 보여 준다
// - 실패: 실패 이유별 안내 + "다시 시도"(방향 입력 없이). 방향 바꾸기로 다시 만들다 실패했으면 그때 적은 방향을 그대로 다시 보낸다
//   (서버는 이 탭에 완료된 결과가 있을 때만 피드백을 요구한다. 처음 만들기가 실패한 뒤 다시 시도는 피드백 없이 된다 — BE-nerdnam #23, C-03 v0.1.4.
//    그래도 400 이 오면 서버 문장을 보여 주고, 오른쪽 "방향 바꾸기"로 다시 만들 수 있다)
// - 방향 바꾸기: 원하는 방향(피드백)을 적어야 누를 수 있다. 만드는 중에는 막는다. 횟수 상한은 없다
// - 방향 제시 평가: 공고마다 하나, 어느 탭에서나 같은 값 (PUT /guides/rating, 다시 보내면 덮어씀 · 기획서 4.6)
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { aiFailureMessage, waitForAiJob } from "@/shared/api/aiJob";
import { api } from "@/shared/api/client";
import { isProblem, problemMessage } from "@/shared/api/problem";
import type { GuideTab } from "@/shared/routes";
import { Button } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { Textarea } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { Rating } from "@/shared/ui/Rating";
import { cx } from "@/shared/ui/cx";
import { StateCard, StateText } from "@/shared/ui/StateCard";
import { useFocusAfterRender } from "@/shared/useFocusAfterRender";
import { REGEN_HINT, type GuideStatus } from "./guide";
import { announceGuideStatus } from "./GuideTabs";
import styles from "./Guide.module.css";

const GUIDE_POLL_MS = 5000;
// 탭을 열었을 때 이미 실패해 있으면 이유를 모른다 (탭 조회에는 실패 이유가 없음)
const UNKNOWN_FAILURE = "잠시 후 다시 시도해 주세요.";

type GuideBoardProps = {
  postingId: number;
  tab: GuideTab;
  tabLabel: string; // "지원동기" …
  status: GuideStatus; // null = 아직 만든 적 없음
  runningJobId: number | null;
  lastFeedback: string | null; // 가장 최근 생성 때 적은 방향 (실패한 다시 만들기를 다시 시도할 때 그대로 보낸다)
  rating: { score: number; comment: string } | null;
  panel: ReactNode; // 완료일 때만
  sources: ReactNode;
};

type State = { state: "done" } | { state: "waiting" } | { state: "failed"; message: string; error: string | null };

export function GuideBoard({ postingId, tab, tabLabel, status, runningJobId, lastFeedback, rating, panel, sources }: GuideBoardProps) {
  const router = useRouter();
  const [state, setState] = useState<State>(
    status === "completed" ? { state: "done" } : status === "failed" ? { state: "failed", message: UNKNOWN_FAILURE, error: null } : { state: "waiting" },
  );
  const [feedback, setFeedback] = useState("");
  const [regenError, setRegenError] = useState<string | null>(null);
  const focusAfter = useFocusAfterRender();
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false); // 개발 모드에서 effect 가 두 번 돌아도 만들기를 한 번만 시작한다
  const path = { params: { path: { postingId, tab } } };

  function restart() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller.signal;
  }

  // 작업이 끝날 때까지 기다린 뒤: 완료 → 서버에서 다시 그려 내용을 보여 준다, 실패 → 이유 안내
  function wait(jobId: number) {
    waitForAiJob(jobId, restart()).then((done) => {
      if (!done) return; // 화면을 떠남
      if (done.status === "completed") router.refresh();
      else setState({ state: "failed", message: aiFailureMessage(done.failureCode), error: null });
    });
  }

  // 작업 번호 없이 "만드는 중"일 때: 탭을 몇 초마다 다시 물어 상태가 바뀌면 다시 그린다
  async function pollGuide() {
    const signal = restart();
    while (!signal.aborted) {
      await new Promise((resolve) => setTimeout(resolve, GUIDE_POLL_MS));
      if (signal.aborted) return;
      const { data } = await api.GET("/api/job-postings/{postingId}/guides/{tab}", { ...path, signal }).catch(() => ({ data: undefined }));
      if (data && data.status !== "generating") return router.refresh();
    }
  }

  // 만들기 시작 (처음 만들기·다시 시도·방향 바꾸기). 실패하면 화면에 띄울 문장을 돌려준다
  async function generate(text: string | null): Promise<string | null> {
    // 보내지도 못하면(네트워크·CSRF 토큰) 아래 기본 문장으로 실패를 보여 준다 — 안 그러면 "만드는 중"에 멈춘다
    const { data, error } = await api
      .POST("/api/job-postings/{postingId}/guides/{tab}", { ...path, body: { feedback: text } })
      .catch(() => ({ data: undefined, error: undefined }));
    if (data) {
      wait(data.jobId);
      return null;
    }
    // 이미 만들고 있으면(409 + runningJobId) 그 작업을 기다린다 (ADR-0002)
    if (isProblem(error) && error.runningJobId != null) {
      wait(error.runningJobId);
      return null;
    }
    return problemMessage(error, "만들기를 시작하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  }

  // 탭을 열었을 때: 아직 안 만들었으면 만들기 시작, 만드는 중이면 이어서 기다린다
  useEffect(() => {
    if (status === null && !startedRef.current) {
      startedRef.current = true;
      generate(null).then((error) => error && setState({ state: "failed", message: UNKNOWN_FAILURE, error }));
    } else if (status === "generating") {
      if (runningJobId !== null) wait(runningJobId);
      else pollGuide();
    }
    return () => abortRef.current?.abort();
    // 처음 한 번만 (서버가 상태를 바꿔 주면 page.tsx 의 key 가 바뀌어 새로 만들어진다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 탭 줄의 이 탭 표시를 맞춘다 (만드는 중·완료·실패)
  useEffect(() => {
    announceGuideStatus(tab, state.state === "done" ? "completed" : state.state === "waiting" ? "generating" : "failed");
  }, [tab, state.state]);

  // 실패 상자의 "다시 시도": 방향 입력 없이. 직전에 적은 방향이 있으면 그대로 다시 보낸다
  async function retry() {
    const message = state.state === "failed" ? state.message : UNKNOWN_FAILURE;
    // 누른 버튼이 사라지므로 커서를 "만드는 중" 상자로 옮긴다 (FE-16)
    focusAfter("guide-state");
    setState({ state: "waiting" });
    const error = await generate(lastFeedback);
    if (error) setState({ state: "failed", message, error });
  }

  // 방향 바꾸기: 왼쪽이 "만드는 중" 상자로 바뀌고 누른 버튼은 막히므로, 커서를 그 상자로 옮긴다 (FE-16)
  async function regenerate() {
    const before = state;
    setRegenError(null);
    focusAfter("guide-state");
    setState({ state: "waiting" });
    const error = await generate(feedback.trim());
    if (error) {
      setState(before);
      setRegenError(error);
    }
  }

  return (
    <div className={styles.split}>
      <section className={styles.main} aria-label={`${tabLabel} 작성 방향`}>
        {/* 인쇄할 때는 탭 줄이 빠지므로, 어느 탭인지 제목으로 남긴다 */}
        <h2 className={cx("print-only", styles.printTitle)}>{tabLabel}</h2>
        {state.state === "done" && panel}
        {state.state === "waiting" && (
          <StateCard id="guide-state" tone="wait" title={`${tabLabel} 방향을 만들고 있어요`}>
            <StateText>공고와 확정한 내 경험을 바탕으로 만들고 있어요. 보통 1분쯤 걸려요.</StateText>
          </StateCard>
        )}
        {state.state === "failed" && (
          <StateCard id="guide-state" tone="bad" title={`${tabLabel} 방향을 만들지 못했어요`}>
            <StateText>{state.message}</StateText>
            {state.error && (
              <Callout tone="bad" icon="alert" role="alert">
                {state.error}
              </Callout>
            )}
            <Button onClick={retry}>
              <Icon name="refresh" size="sm" />
              다시 시도
            </Button>
          </StateCard>
        )}
      </section>

      {/* 오른쪽 칸(근거·방향 바꾸기·평가)은 인쇄하지 않는다 */}
      <aside className={cx(styles.side, "print-hide")} aria-label="근거와 방향 바꾸기">
        {sources}

        <Card size="sm" aria-labelledby="regen-title" className={styles.sideCard}>
          <h2 id="regen-title" className={styles.sideTitle}>
            방향 바꾸기
          </h2>
          <label htmlFor="regen-feedback" className={styles.regenLabel}>
            원하는 방향을 알려 주면 이 탭만 다시 만들어요.
          </label>
          <Textarea
            id="regen-feedback"
            rows={3}
            className={styles.regenInput}
            placeholder={REGEN_HINT[tab]}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
          />
          {regenError && (
            <Callout tone="bad" icon="alert" role="alert">
              {regenError}
            </Callout>
          )}
          {/* 방향을 적어야 누를 수 있다 (S05 다시 나누기와 같은 규칙, 서버도 빈 피드백은 400). 만드는 중에는 막는다 */}
          <Button disabled={!feedback.trim() || state.state === "waiting"} onClick={regenerate}>
            <Icon name="refresh" size="sm" />이 탭 다시 만들기
          </Button>
        </Card>

        {/* 방향 제시 평가: 탭마다가 아니라 공고마다 한 번, 언제든 바꿀 수 있음 (기획서 4.6·9.1) */}
        <Card size="sm" aria-label="방향 제시 평가" className={styles.sideCard}>
          <Rating
            legend="이 작성 방향이 도움이 됐나요?"
            placeholder="예: 지원동기 방향이 너무 일반적이에요"
            initialScore={rating?.score}
            initialComment={rating?.comment}
            onSubmit={async ({ score, comment }) => {
              const { error } = await api.PUT("/api/job-postings/{postingId}/guides/rating", {
                params: { path: { postingId } },
                body: { score, comment: comment || null },
              });
              return error ? problemMessage(error, "평가를 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.") : null;
            }}
          />
        </Card>
      </aside>
    </div>
  );
}
