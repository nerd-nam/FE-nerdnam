// AI 작업 기다리기 (C-02 공통 확인할 것 3, C-03): AI 를 부르는 요청은 202 + jobId 를 바로 주고,
// 웹이 GET /api/ai-jobs/{jobId} 를 몇 초마다 다시 물어 끝났는지 본다(폴링). 간격은 웹이 정한다(2~3초 제안).
// 새로고침하거나 화면을 나갔다 와도, 화면 조회 응답의 runningJobId 로 이어서 기다릴 수 있다.
// 브라우저에서만 쓴다 (버튼을 누른 뒤·화면을 보는 동안 바뀌는 상태라서).
import type { components } from "./schema";
import { api } from "./client";

export type AiJob = components["schemas"]["AiJobView"];
type FailureCode = NonNullable<AiJob["failureCode"]>;

const INTERVAL_MS = 2500;

// 작업이 끝날 때까지(완료·실패) 묻는다. signal 이 끊기면(화면을 떠남) null.
// 조회가 실패하면(네트워크 등) 실패한 작업처럼 돌려준다 — 화면이 "다시 시도"를 보여 줄 수 있게
export async function waitForAiJob(jobId: number, signal: AbortSignal): Promise<AiJob | null> {
  while (!signal.aborted) {
    const { data } = await api.GET("/api/ai-jobs/{jobId}", { params: { path: { jobId } }, signal }).catch(() => ({ data: undefined }));
    if (signal.aborted) return null;
    if (!data) return { ...FAILED, id: jobId };
    if (data.status !== "in_progress") return data;
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
  return null;
}

const FAILED = { status: "failed", failureCode: "internal" } as AiJob;

// 실패 이유별 안내 (ADR-0001: GPU 서버가 꺼져 있으면 기다리지 않고 바로 실패, 켜지는 데 몇 분)
const FAILURE_MESSAGE: Record<FailureCode, string> = {
  gpu_unavailable: "AI 서버가 잠시 꺼져 있어요. 켜지는 데 몇 분 걸릴 수 있으니 잠시 뒤 다시 시도해 주세요.",
  timeout: "AI 응답이 너무 오래 걸렸어요. 잠시 뒤 다시 시도해 주세요.",
  ai_error: "AI가 이번 요청을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
  internal: "처리 중에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
};

export function aiFailureMessage(code: AiJob["failureCode"]) {
  return FAILURE_MESSAGE[code ?? "internal"];
}
