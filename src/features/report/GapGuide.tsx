import Link from "next/link";
import { NEW_PROJECT_ID, routes } from "@/shared/routes";
import { Card } from "@/shared/ui/Card";
import { cx } from "@/shared/ui/cx";
import { VERDICT_LABEL, type MatchResult } from "./mock";
import styles from "./Report.module.css";

// S08 오른쪽 갭 대응 가이드: 미충족·부분 충족 요건마다 가이드 + "하지 말 것" (기획서 F5, ADR-0003)
// 미충족을 먼저 보여 준다 (디자인 순서)
export function GapGuide({ results }: { results: MatchResult[] }) {
  const gaps = [...results.filter((r) => r.verdict === "unmet"), ...results.filter((r) => r.verdict === "partial")];

  return (
    <Card size="sm" aria-labelledby="gap-title" className={styles.side}>
      <h2 id="gap-title" className={styles.sideTitle}>
        갭 대응 가이드
      </h2>
      {gaps.length === 0 && <p className={styles.reason}>모든 요건에 근거 경험이 있어요.</p>}
      {gaps.map((r) => (
        <div key={r.id} className={styles.gap}>
          <span className={cx(styles.gapLabel, r.verdict === "unmet" ? styles.unmet : styles.partial)}>
            {r.text} · {VERDICT_LABEL[r.verdict]}
            {/* AI 가 실패해 판정별 기본 문구로 대신한 경우 (ADR-0003). 맞춤 조언이 아니라는 것만 작게 알린다 */}
            {r.gapGuide?.source === "fallback" && <span className={styles.fallback}>일반 안내</span>}
          </span>
          {r.gapGuide && (
            <>
              <p className={styles.advice}>{r.gapGuide.advice}</p>
              <p className={styles.avoid}>하지 말 것: {r.gapGuide.avoid}</p>
            </>
          )}
        </div>
      ))}
      <Link href={routes.project(NEW_PROJECT_ID)} className={styles.addProject}>
        빠진 경험이 있다면 프로젝트 추가하기
      </Link>
    </Card>
  );
}
