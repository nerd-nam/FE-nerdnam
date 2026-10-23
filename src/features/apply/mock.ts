// S10 에서 쓰는 임시 데이터. API(C-03 계약)가 나오면 공고 목록 조회(BE PostingSummary)로 바꾼다.
// 공고 번호는 S07·S08·S09 임시 데이터와 맞췄다 (j_201 완료, j_202 분석 중, j_203 실패, j_204 완료, j_205 작성 중).

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

// 최근에 고친 것부터 (BE 정렬과 같음)
export const MOCK_POSTINGS: PostingSummary[] = [
  { jdId: "j_202", company: "△△커머스", position: "서버 개발자", status: "analyzing", date: "2026.10.23" },
  {
    jdId: "j_201",
    company: "OO페이",
    position: "백엔드 개발자 (결제 플랫폼)",
    status: "done",
    date: "2026.10.21",
    counts: { requiredMet: 3, requiredTotal: 3, preferredMet: 1, preferredPartial: 1, preferredTotal: 3 },
  },
  { jdId: "j_205", company: "▽▽소프트", position: "백엔드 개발자", status: "draft", date: "2026.10.22" },
  { jdId: "j_203", company: "□□랩", position: "백엔드 엔지니어", status: "failed", date: "2026.10.22" },
  {
    jdId: "j_204",
    company: "◇◇페이먼츠",
    position: "백엔드 개발자",
    status: "done",
    date: "2026.10.21",
    counts: { requiredMet: 3, requiredTotal: 3, preferredMet: 1, preferredPartial: 1, preferredTotal: 3 },
  },
];
