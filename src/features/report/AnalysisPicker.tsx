"use client";

// S08 "분석 기록": 이전 분석을 골라 본다 (기획서 v1.25, FE-nerdnam #5). 디자인이 없어 기존 선택 상자로 간단히 만들었다.
// 고르면 주소가 바뀐다(/apply/j_201/report?analysis=fa_2011). 주소가 있으니 새로고침·공유해도 같은 분석이 열린다.
import { useRouter } from "next/navigation";
import { routes } from "@/shared/routes";
import { Select } from "@/shared/ui/Field";
import type { AnalysisSummary } from "./mock";
import styles from "./Report.module.css";

const STATUS_TEXT = { done: "분석", analyzing: "분석 중", failed: "분석 실패" } as const;

type AnalysisPickerProps = {
  jdId: string;
  analyses: AnalysisSummary[]; // 맨 앞이 가장 최근
  currentId: string;
};

export function AnalysisPicker({ jdId, analyses, currentId }: AnalysisPickerProps) {
  const router = useRouter();
  const latestId = analyses[0].analysisId;

  return (
    <div className={styles.picker}>
      <label htmlFor="analysis-picker" className={styles.pickerLabel}>
        분석 기록
      </label>
      <Select
        id="analysis-picker"
        className={styles.pickerSelect}
        value={currentId}
        // 가장 최근 분석은 ?analysis= 없이 기본 주소로 보낸다
        onChange={(event) => router.push(routes.report(jdId, event.target.value === latestId ? undefined : event.target.value))}
      >
        {analyses.map((a) => (
          <option key={a.analysisId} value={a.analysisId}>
            {a.analyzedAt ? `${a.analyzedAt} ` : ""}
            {STATUS_TEXT[a.status]}
            {a.analysisId === latestId ? " (최신)" : ""}
          </option>
        ))}
      </Select>
    </div>
  );
}
