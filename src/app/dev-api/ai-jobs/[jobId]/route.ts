import { NextResponse, type NextRequest } from "next/server";
import { USE_PRISM } from "@/shared/api/origin";

// 개발용 AI 작업 조회 대역 (Prism 을 쓸 때만). GET /api/ai-jobs/{jobId} 가 여기로 온다 (next.config.ts).
// Prism 은 계약의 예시(status: in_progress)만 돌려줘서 기다리기가 끝나지 않는다. 그래서 "끝났음"으로 답해
// 재구성 → 검토 이동 같은 흐름을 개발 중에 볼 수 있게 한다. 실패 화면을 보고 싶으면 ?fail=gpu_unavailable 처럼 붙여 부른다.
export async function GET(request: NextRequest, { params }: RouteContext<"/dev-api/ai-jobs/[jobId]">) {
  if (!USE_PRISM || process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }
  const { jobId } = await params;
  const fail = request.nextUrl.searchParams.get("fail");
  const now = new Date().toISOString();
  return NextResponse.json({
    id: Number(jobId),
    jobType: "restructure",
    status: fail ? "failed" : "completed",
    failureCode: fail,
    targetType: "project",
    targetId: 1,
    resultId: fail ? null : 1,
    lockScope: "project",
    mode: "initial",
    requestedAt: now,
    finishedAt: now,
  });
}
