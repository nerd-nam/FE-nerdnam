import { Card } from "@/shared/ui/Card";
import { EvidenceLink } from "@/shared/ui/EvidenceLink";
import type { GuideSource } from "./mock";
import styles from "./Guide.module.css";

// S09 오른쪽 "이 방향에 쓰인 근거" (C-02 S09 조회: 근거 이름, 원본으로 갈 id, 관련 요건 수)
export function SourcesCard({ sources }: { sources: GuideSource[] }) {
  return (
    <Card size="sm" aria-labelledby="src-title" className={styles.sideCard}>
      <h2 id="src-title" className={styles.sideTitle}>
        이 방향에 쓰인 근거
      </h2>
      <p className={styles.meta}>모든 제안은 확정된 내 경험에서만 나와요.</p>
      <ul className={styles.sourceList}>
        {sources.map(({ evidence, requirementCount }) => (
          <li key={evidence.label} className={styles.sourceItem}>
            <EvidenceLink evidence={evidence} className={styles.sourceLink}>
              {evidence.label}
            </EvidenceLink>
            <span className={styles.meta}>요건 {requirementCount}개</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
