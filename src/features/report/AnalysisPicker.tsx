"use client";

// S08 "분석 기록": 이전 분석을 골라 본다 (기획서 v1.25, FE-nerdnam #5). 디자인이 없어 기존 선택 상자로 간단히 만들었다.
// 고르면 주소가 바뀐다(/apply/1/report?analysis=3). 주소가 있으니 새로고침·공유해도 같은 분석이 열린다.
import { useRouter } from "next/navigation";
import { routes } from "@/shared/routes";
import { Select } from "@/shared/ui/Field";
import { analyzedAt, type AnalysisSummary } from "./report";
import styles from "./Report.module.css";

const STATUS_TEXT = { completed: "분석", in_progress: "분석 중", failed: "분석 실패" } as const;

type AnalysisPickerProps = {
  postingId: string;
  analyses: AnalysisSummary[]; // 맨 앞이 가장 최근 (서버가 최신순으로 준다)
  currentId: number;
};

export function AnalysisPicker({ postingId, analyses, currentId }: AnalysisPickerProps) {
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
        onChange={(event) => {
          const id = Number(event.target.value);
          router.push(routes.report(postingId, id === latestId ? undefined : String(id)));
        }}
      >
        {analyses.map((a) => (
          <option key={a.analysisId} value={a.analysisId}>
            {analyzedAt(a)} {STATUS_TEXT[a.status]}
            {a.analysisId === latestId ? " (최신)" : ""}
          </option>
        ))}
      </Select>
    </div>
  );
}
