"use client";

// S08 요건별 판정 목록 + 판정 필터(전체·충족·부분·미충족). 필터를 누르면 목록이 바뀌어서 클라이언트 컴포넌트다.
import Link from "next/link";
import { useState } from "react";
import { routes } from "@/shared/routes";
import { VerdictBadge, type Verdict } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { Icon } from "@/shared/ui/Icon";
import type { Evidence, MatchResult } from "./mock";
import styles from "./Report.module.css";

type Filter = "all" | Verdict;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "met", label: "충족" },
  { value: "partial", label: "부분" },
  { value: "unmet", label: "미충족" },
];

// 근거를 누르면 갈 곳: 사례 → S05 읽기 모드에서 그 사례 펼침, 기술·경력 → 내 경험 (C-02 S08 확인할 것 2번)
function evidenceHref(evidence: Evidence) {
  return evidence.kind === "episode" ? routes.reviewEpisode(evidence.projectId, evidence.episodeId) : routes.library;
}

export function RequirementList({ results }: { results: MatchResult[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const count = (value: Filter) => (value === "all" ? results.length : results.filter((r) => r.verdict === value).length);
  const shown = filter === "all" ? results : results.filter((r) => r.verdict === filter);

  return (
    <Card aria-labelledby="req-title" className={styles.main}>
      <div className={styles.between}>
        <h2 id="req-title" className={styles.cardTitle}>
          요건별 판정
        </h2>
        <div role="group" aria-label="판정 필터" className={styles.filters}>
          {FILTERS.map((f) => (
            <Chip key={f.value} size="sm" pressed={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label} {count(f.value)}
            </Chip>
          ))}
        </div>
      </div>

      <ul className={styles.rows}>
        {shown.map((r) => (
          <li key={r.id} className={styles.row}>
            <div>
              <VerdictBadge verdict={r.verdict} />
            </div>
            <div className={styles.rowBody}>
              <div className={styles.rowTitle}>
                <span className={styles.kind}>{r.type === "required" ? "필수" : "우대"}</span>
                <strong>{r.text}</strong>
              </div>
              <p className={styles.reason}>{r.reason}</p>
              {r.evidence.length > 0 && (
                <div className={styles.sources}>
                  {r.evidence.map((e) => (
                    <Link key={e.label} href={evidenceHref(e)} className={styles.src}>
                      <Icon name="link" size="sm" />
                      {e.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
