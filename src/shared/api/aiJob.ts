// AI 작업 기다리기 (C-02 공통 확인할 것 3, C-03): AI 를 부르는 요청은 202 + jobId 를 바로 주고,
// 웹이 GET /api/ai-jobs/{jobId} 를 몇 초마다 다시 물어 끝났는지 본다(폴링). 간격은 웹이 정한다(2~3초 제안).
// 새로고침하거나 화면을 나갔다 와도, 화면 조회 응답의 runningJobId 로 이어서 기다릴 수 있다.
// 브라우저에서만 쓴다 (버튼을 누른 뒤·화면을 보는 동안 바뀌는 상태라서).
import type { components } from "./schema";
import { api } from "./client";

export type AiJob = components["schemas"]["AiJobView"];
type FailureCode = NonNullable<AiJob["failureCode"]>;

const INTERVAL_MS = 2500;
// 조회가 이만큼 연달아 실패하면 포기한다 (큐 대기로 오래 기다리는 동안 한 번 끊긴 것으로 실패시키지 않게, ADR-0009)
const MAX_MISSES = 3;

// 작업이 끝날 때까지(완료·실패) 묻는다. signal 이 끊기면(화면을 떠남) null.
// 조회가 연달아 실패하면(네트워크 등) 실패한 작업처럼 돌려준다 — 화면이 "다시 시도"를 보여 줄 수 있게
export async function waitForAiJob(jobId: number, signal: AbortSignal): Promise<AiJob | null> {
  let misses = 0;
  while (!signal.aborted) {
    const { data } = await api.GET("/api/ai-jobs/{jobId}", { params: { path: { jobId } }, signal }).catch(() => ({ data: undefined }));
    if (signal.aborted) return null;
    if (!data && ++misses >= MAX_MISSES) return { ...FAILED, id: jobId };
    if (data) misses = 0;
    if (data && data.status !== "in_progress") return data;
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
  return null;
}

const FAILED = { status: "failed", failureCode: "internal" } as AiJob;

// 실패 이유별 안내. gpu_unavailable 은 AI 서버를 쓸 수 없거나(HTTP 경로) 요청이 몰려 큐에 넣지 못한 것(큐 경로, ADR-0009)
const FAILURE_MESSAGE: Record<FailureCode, string> = {
  gpu_unavailable: "지금 AI 요청이 몰려 있어 받지 못했어요. 잠시 뒤 다시 시도해 주세요.",
  timeout: "AI 응답이 너무 오래 걸렸어요. 잠시 뒤 다시 시도해 주세요.",
  ai_error: "AI가 이번 요청을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
  internal: "처리 중에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
};

export function aiFailureMessage(code: AiJob["failureCode"]) {
  return FAILURE_MESSAGE[code ?? "internal"];
}
