import { Card } from "@/shared/ui/Card";
import { cx } from "@/shared/ui/cx";
import type { MatchResult, RequirementType } from "./mock";
import styles from "./Report.module.css";

// S08 맨 위 요약: 필수·우대 충족률 카드 + 한 줄 진단 (기획서 F5)
// 충족률은 판정 결과로 화면에서 센다. 한 줄 진단은 API 가 만든 문장을 그대로 보여 준다 (ADR-0003)
export function ScoreCards({ results, diagnosis }: { results: MatchResult[]; diagnosis: string }) {
  return (
    <section className={styles.summary} aria-label="요약">
      <ScoreCard label="필수사항" results={results} type="required" />
      <ScoreCard label="우대사항" results={results} type="preferred" />
      <Card tone="dark" size="sm" className={styles.diagnosis}>
        <span className={styles.diagnosisLabel}>한 줄 진단</span>
        <p className={styles.diagnosisText}>{diagnosis}</p>
      </Card>
    </section>
  );
}

function ScoreCard({ label, results, type }: { label: string; results: MatchResult[]; type: RequirementType }) {
  const rows = results.filter((r) => r.type === type);
  const met = rows.filter((r) => r.verdict === "met").length;
  const partial = rows.filter((r) => r.verdict === "partial").length;

  return (
    <Card size="sm" className={styles.scoreCard}>
      <span className={styles.scoreLabel}>{label}</span>
      <span className={styles.score}>
        {met}
        <span className={styles.scoreSub}>
          {" "}
          / {rows.length} 충족{partial > 0 && ` · 부분 ${partial}`}
        </span>
      </span>
      {/* 막대는 위 숫자를 그림으로 보여 주는 것뿐이라 스크린리더는 건너뛴다 */}
      <div className={styles.bar} style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }} aria-hidden="true">
        {rows.map((r) => (
          <span key={r.id} className={cx(r.verdict === "met" && styles.barMet, r.verdict === "partial" && styles.barPartial)} />
        ))}
      </div>
    </Card>
  );
}
