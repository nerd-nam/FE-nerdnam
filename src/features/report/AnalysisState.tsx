"use client";

// S08 분석 중 / 분석 실패 상자 (작업목록 FE-12). 디자인이 없어 공용 상태 카드(StateCard)로 만들었다.
// - 분석 중: 서버가 준 작업 번호(runningJobId)로 끝날 때까지 기다린다(2.5초 폴링, C-02 공통 3번, S04 와 같음).
//   작업 번호가 없으면(작업은 끝났는데 결과 저장이 막 끝나기 전 등) 이 분석의 리포트를 5초마다 다시 묻는다 (FE 결정 2026-10-26).
//   끝나면 화면을 서버에서 다시 그려(router.refresh) 리포트를 보여 준다.
// - 실패: 실패 이유별 안내 + "다시 시도"(최신 분석일 때만) = 분석을 새로 시작한다 (POST /analyses, S07 과 같음)
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { aiFailureMessage, waitForAiJob } from "@/shared/api/aiJob";
import { api } from "@/shared/api/client";
import { isProblem, problemMessage } from "@/shared/api/problem";
import { Button } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Icon } from "@/shared/ui/Icon";
import { StateCard, StateText } from "@/shared/ui/StateCard";
import { useFocusAfterRender } from "@/shared/useFocusAfterRender";
import type { AnalysisStatus, FailureCode } from "./report";

const REPORT_POLL_MS = 5000;

type AnalysisStateProps = {
  postingId: number;
  analysisId: number;
  status: Exclude<AnalysisStatus, "completed">;
  failureCode: FailureCode;
  runningJobId: number | null;
  canRetry: boolean; // 최신 분석일 때만 다시 시도한다 (예전 분석은 "최신 분석 보기"로)
};

type State = { state: "waiting" } | { state: "failed"; message: string; error: string | null };

export function AnalysisState({ postingId, analysisId, status, failureCode, runningJobId, canRetry }: AnalysisStateProps) {
  const router = useRouter();
  const focusAfter = useFocusAfterRender();
  const [state, setState] = useState<State>(
    status === "in_progress" ? { state: "waiting" } : { state: "failed", message: aiFailureMessage(failureCode), error: null },
  );
  const abortRef = useRef<AbortController | null>(null);

  function restart() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller.signal;
  }

  // 작업이 끝날 때까지 기다린 뒤: 완료 → 서버에서 다시 그려 리포트를 보여 준다, 실패 → 이유 안내
  function wait(jobId: number) {
    waitForAiJob(jobId, restart()).then((done) => {
      if (!done) return; // 화면을 떠남
      if (done.status === "completed") router.refresh();
      else setState({ state: "failed", message: aiFailureMessage(done.failureCode), error: null });
    });
  }

  // 작업 번호 없이 "분석 중"일 때: 이 분석의 리포트를 몇 초마다 다시 물어 상태가 바뀌면 다시 그린다
  async function pollReport() {
    const signal = restart();
    while (!signal.aborted) {
      await new Promise((resolve) => setTimeout(resolve, REPORT_POLL_MS));
      if (signal.aborted) return;
      const { data } = await api.GET("/api/fit-analyses/{analysisId}", { params: { path: { analysisId } }, signal }).catch(() => ({ data: undefined }));
      if (data && data.status !== "in_progress") return router.refresh();
    }
  }

  // 화면을 열었는데 분석 중이면 이어서 기다린다
  useEffect(() => {
    if (status === "in_progress") {
      if (runningJobId !== null) wait(runningJobId);
      else pollReport();
    }
    return () => abortRef.current?.abort();
    // 처음 한 번만 (서버가 상태를 바꿔 주면 page.tsx 의 key 가 바뀌어 새로 만들어진다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function retry() {
    // 누른 버튼이 사라지므로 커서를 "분석 중" 상자로 옮긴다 (FE-16)
    focusAfter("analysis-state");
    setState({ state: "waiting" });
    const { data, error } = await api.POST("/api/job-postings/{postingId}/analyses", { params: { path: { postingId } } });
    if (data) return wait(data.jobId);
    // 이미 분석이 돌고 있으면(409 + runningJobId) 그 작업을 기다린다 (ADR-0002)
    if (isProblem(error) && error.runningJobId != null) return wait(error.runningJobId);
    setState({
      state: "failed",
      message: aiFailureMessage(failureCode),
      // 공고 입력이 규칙에 맞지 않으면(400) 서버 문장이 온다 → "공고 수정"으로 고치면 된다
      error: problemMessage(error, "분석을 시작하지 못했어요. 잠시 뒤 다시 시도해 주세요."),
    });
  }

  if (state.state === "failed") {
    return (
      <StateCard id="analysis-state" tone="bad" title="분석을 마치지 못했어요">
        {/* 기획서 F4 표 마지막 줄 + 실패 이유별 안내 (FE 결정 2026-10-26, S04·S05·S07 과 같은 문장) */}
        <StateText>입력한 공고는 그대로 남아 있어요. {state.message}</StateText>
        {state.error && (
          <Callout tone="bad" icon="alert" role="alert">
            {state.error}
          </Callout>
        )}
        {canRetry && (
          <Button onClick={retry}>
            <Icon name="refresh" size="sm" />
            다시 시도
          </Button>
        )}
      </StateCard>
    );
  }

  return (
    <StateCard id="analysis-state" tone="wait" title="공고와 내 경험을 맞춰 보고 있어요">
      <StateText>요건마다 내 경험에서 근거를 찾아 판정하고 있어요. 보통 20초쯤 걸려요.</StateText>
    </StateCard>
  );
}
