"use client";

// S02 의 움직이는 부분: 기술 추가 카드 + 추가한 기술 표.
// "추가한 기술" 목록을 두 카드가 함께 쓰므로(추천 칩의 "추가됨" 표시, 표) 상태를 여기 한곳에 둔다.
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { Input } from "@/shared/ui/Field";
import { IconButton } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Table } from "@/shared/ui/Table";
import { cx } from "@/shared/ui/cx";
import { useFocusAfterRender } from "@/shared/useFocusAfterRender";
import {
  CATEGORIES,
  categoryLabel,
  LEVELS,
  MOCK_DICTIONARY,
  MOCK_SUGGESTIONS,
  type Category,
  type MySkill,
} from "./mock";
import type { SkillUsage } from "./usage";
import styles from "./Skills.module.css";

// 표준 사전에서 찾기: 이름이나 별칭에 검색어가 들어 있으면 (대소문자 무시). 실제로는 서버 자동완성 API (BE-04)
function searchDictionary(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_DICTIONARY.filter((entry) => [entry.name, ...entry.aliases].some((word) => word.toLowerCase().includes(q))).slice(0, 8);
}

type SkillsBoardProps = {
  initialSkills: MySkill[];
  usage: Record<string, SkillUsage[]>; // 기술 이름 → 쓰는 곳 (경력·프로젝트)
};

export function SkillsBoard({ initialSkills, usage }: SkillsBoardProps) {
  const [skills, setSkills] = useState(initialSkills);
  // 지우려 했지만 쓰는 곳이 있어 막힌 기술. 있으면 안내창을 띄운다
  const [blocked, setBlocked] = useState<string | null>(null);
  const focusAfter = useFocusAfterRender();
  const [category, setCategory] = useState<Category>("framework");
  const [query, setQuery] = useState("");

  const has = (name: string) => skills.some((s) => s.name === name);

  // 새 기술은 "학습 중"(1)으로 추가한다 (디자인 skills.js 와 같음). 숙련도는 표에서 바꾼다
  function add(name: string, cat: Category) {
    if (has(name)) return;
    setSkills((prev) => [...prev, { name, category: cat, level: 1 }]);
  }

  // 경력·프로젝트에서 쓰는 기술은 지우지 않고 어디서 쓰는지 알려 준다 (ADR-0002 Q7, 서버도 409 로 거부)
  function remove(name: string) {
    if (usage[name]?.length) {
      setBlocked(name);
      return;
    }
    // 지운 뒤 다음 줄(마지막이었으면 윗줄)의 삭제 버튼으로, 다 지웠으면 검색칸으로 커서를 옮긴다 (FE-16)
    const index = skills.findIndex((s) => s.name === name);
    const left = skills.length - 1;
    focusAfter(left === 0 ? "skill-search" : `skill-del-${Math.min(index, left - 1)}`);
    setSkills((prev) => prev.filter((s) => s.name !== name));
  }

  // 검색어가 있으면 검색 결과, 없으면 고른 카테고리의 추천
  const results = searchDictionary(query);
  const chips = query.trim()
    ? results.map((entry) => ({ name: entry.name, category: entry.category }))
    : MOCK_SUGGESTIONS[category].map((name) => ({ name, category }));

  return (
    <>
      <Card aria-labelledby="add-title">
        <h2 id="add-title" className={styles.cardTitle}>
          기술 추가
        </h2>

        <div className={styles.row} role="group" aria-label="카테고리">
          {CATEGORIES.map((c) => (
            <Chip key={c.value} pressed={c.value === category} onClick={() => setCategory(c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>

        <div className={styles.search}>
          <label htmlFor="skill-search" className="sr-only">
            기술 이름 검색
          </label>
          <Icon name="search" />
          <Input
            id="skill-search"
            type="search"
            placeholder="기술 이름으로 검색 (예: spring, k8s)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className={styles.chipGroup}>
          <span className={styles.groupLabel} aria-live="polite">
            {query.trim() ? `"${query.trim()}" 검색 결과 ${results.length}개` : `${categoryLabel(category)}에서 자주 쓰는 기술`}
          </span>
          {chips.length === 0 ? (
            <p className={styles.empty}>표준 사전에서 찾지 못했어요. 다른 이름으로 검색해 보세요.</p>
          ) : (
            <div className={styles.row}>
              {chips.map((chip) =>
                has(chip.name) ? (
                  <Chip key={chip.name} variant="added" disabled>
                    <Icon name="check" size="sm" bold />
                    {chip.name} 추가됨
                  </Chip>
                ) : (
                  <Chip key={chip.name} variant="add" aria-label={`${chip.name} 추가`} onClick={() => add(chip.name, chip.category)}>
                    <Icon name="plus" size="sm" />
                    {chip.name}
                  </Chip>
                ),
              )}
            </div>
          )}
        </div>
      </Card>

      <Card aria-labelledby="list-title">
        <h2 id="list-title" className={styles.cardTitle}>
          추가한 기술 <span className={styles.count}>{skills.length}</span>
        </h2>

        <dl className={styles.levelDefs} aria-label="숙련도 기준">
          {LEVELS.map((l) => (
            <div key={l.level} className={styles.levelDef}>
              <dt>
                {l.level} · {l.name}
              </dt>
              <dd>{l.desc}</dd>
            </div>
          ))}
        </dl>

        <Table variant="plain" className={styles.table}>
          <thead>
            <tr>
              <th scope="col" style={{ width: "30%" }}>
                기술
              </th>
              <th scope="col" style={{ width: "20%" }}>
                카테고리
              </th>
              <th scope="col" style={{ width: "42%" }}>
                숙련도
              </th>
              <th scope="col" style={{ width: "8%" }}>
                <span className="sr-only">삭제</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill, index) => (
              <tr key={skill.name}>
                <td className={styles.name}>{skill.name}</td>
                <td className={styles.muted}>{categoryLabel(skill.category)}</td>
                <td>
                  <div className={styles.level}>
                    <div className={styles.bars}>
                      {LEVELS.map((l) => (
                        <button
                          key={l.level}
                          type="button"
                          className={cx(styles.barBtn, l.level <= skill.level && styles.barOn)}
                          aria-pressed={l.level === skill.level}
                          aria-label={`${skill.name} 숙련도를 ${l.level}단계(${l.name})로 설정`}
                          onClick={() => setSkills((prev) => prev.map((s) => (s.name === skill.name ? { ...s, level: l.level } : s)))}
                        >
                          <span className={styles.bar} />
                        </button>
                      ))}
                    </div>
                    <span className={styles.levelName}>{LEVELS[skill.level - 1].name}</span>
                  </div>
                </td>
                <td>
                  <IconButton id={`skill-del-${index}`} label={`${skill.name} 삭제`} onClick={() => remove(skill.name)}>
                    <Icon name="x" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Dialog
        open={blocked !== null}
        onClose={() => setBlocked(null)}
        title={`‘${blocked ?? ""}’ 기술은 지울 수 없어요`}
        actions={<Button onClick={() => setBlocked(null)}>닫기</Button>}
      >
        <p>아래에서 쓰고 있어요. 그곳에서 이 기술을 먼저 빼면 지울 수 있어요.</p>
        <ul className={styles.usageList}>
          {(blocked ? usage[blocked] : []).map((u) => (
            <li key={u.label}>
              <Link href={u.href}>{u.label}</Link>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
