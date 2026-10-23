"use client";

// S04 프로젝트 기간. 값이 바뀌어야 오류(형식·미래·순서)를 보여 줄 수 있어서 이 칸만 클라이언트 컴포넌트로 뗐다.
// 양식의 나머지 칸처럼 name(periodStart·periodEnd)으로 값을 함께 낸다 (④ 저장 때 쓴다).
// 기획서에 프로젝트 기간이 필수라는 규칙은 없어서 비워 둘 수 있다.
import { useState } from "react";
import { PeriodField, type Period } from "@/shared/ui/PeriodField";

export function ProjectPeriod({ initial }: { initial: { start: string; end: string } }) {
  const [period, setPeriod] = useState<Period>(initial);
  return (
    <PeriodField id="project" label="기간" value={period} onChange={setPeriod} names={{ start: "periodStart", end: "periodEnd" }} />
  );
}
