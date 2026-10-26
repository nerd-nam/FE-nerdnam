// S10 공고 카드에 쓰는 모양과, 서버 응답(PostingSummary, C-03 계약)을 그 모양으로 바꾸는 함수.
// 화면 코드는 계약 이름을 몰라도 되게, 서버 응답은 여기서 한 번만 바꾼다.
import type { components } from "@/shared/api/schema";
import { formatDate } from "@/shared/date";

type ApiPostingSummary = components["schemas"]["PostingSummary"];

// 공고 상태 (C-02 S10 조회). 분석하지 않은 공고는 "작성 중"
export type PostingStatus = "draft" | "analyzing" | "failed" | "done";

export type PostingSummary = {
  jdId: string;
  company: string;
  position: string;
  status: PostingStatus;
  date: string; // 분석했으면 분석(시작·시도)일, 아니면 마지막 수정일. "2026.10.21"
  // 분석 완료일 때만
  counts?: { requiredMet: number; requiredTotal: number; preferredMet: number; preferredPartial: number; preferredTotal: number };
};

// 서버 상태 이름 → 화면 상태 이름
const STATUS: Record<ApiPostingSummary["status"], PostingStatus> = {
  draft: "draft",
  in_progress: "analyzing",
  failed: "failed",
  completed: "done",
};

export function toPostingSummary(p: ApiPostingSummary): PostingSummary {
  const status = STATUS[p.status];
  const { requiredMet, requiredTotal, preferredMet, preferredPartial, preferredTotal } = p;
  // 충족 수는 분석이 끝났을 때만 값이 있다(그 밖에는 null)
  const counts =
    status === "done" && requiredMet !== null && requiredTotal !== null && preferredMet !== null && preferredPartial !== null && preferredTotal !== null
      ? { requiredMet, requiredTotal, preferredMet, preferredPartial, preferredTotal }
      : undefined;
  return {
    jdId: String(p.id),
    company: p.companyName,
    position: p.positionName,
    status,
    date: formatDate(p.analyzedAt ?? p.updatedAt),
    counts,
  };
}
