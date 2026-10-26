import { Card } from "@/shared/ui/Card";
import { cx } from "@/shared/ui/cx";
import type { Count, MatchResult, RequirementType } from "./report";
import styles from "./Report.module.css";

// S08 맨 위 요약: 필수·우대 충족률 카드 + 한 줄 진단 (기획서 F5)
// 충족 수는 서버가 센 값(required·preferred)을, 한 줄 진단은 API 가 만든 문장을 그대로 보여 준다 (ADR-0003)
type ScoreCardsProps = { results: MatchResult[]; required: Count; preferred: Count; diagnosis: string };

export function ScoreCards({ results, required, preferred, diagnosis }: ScoreCardsProps) {
  return (
    <section className={styles.summary} aria-label="요약">
      <ScoreCard label="필수사항" results={results} type="required" count={required} />
      <ScoreCard label="우대사항" results={results} type="preferred" count={preferred} />
      <Card tone="dark" size="sm" className={styles.diagnosis}>
        <span className={styles.diagnosisLabel}>한 줄 진단</span>
        <p className={styles.diagnosisText}>{diagnosis}</p>
      </Card>
    </section>
  );
}

type ScoreCardProps = { label: string; results: MatchResult[]; type: RequirementType; count: Count };

function ScoreCard({ label, results, type, count }: ScoreCardProps) {
  const rows = results.filter((r) => r.type === type);

  return (
    <Card size="sm" className={styles.scoreCard}>
      <span className={styles.scoreLabel}>{label}</span>
      <span className={styles.score}>
        {count.met}
        <span className={styles.scoreSub}>
          {" "}
          / {count.total} 충족{count.partial > 0 && ` · 부분 ${count.partial}`}
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
