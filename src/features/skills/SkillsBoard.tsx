"use client";

// S02 의 움직이는 부분: 기술 추가 카드 + 추가한 기술 표 + 아래 이전/다음 버튼.
// "추가한 기술" 목록을 두 카드가 함께 쓰므로(검색 결과 칩의 "추가됨" 표시, 표) 상태를 여기 한곳에 둔다.
// 카테고리는 보여 주거나 고르게 하지 않는다 (FE 결정 2026-10-27). 저장할 때 검색 결과에 붙어 온 카테고리를 보내기만 한다.
//
// 저장 (FE 결정 2026-10-26): 추가·숙련도·삭제는 화면에서만 바꿔 두고, 화면을 떠날 때(이전·다음·검토로 돌아가기·
// 머리글 "저장하고 나중에 하기") 서버에 한 번에 보낸다. 마지막으로 저장한 상태(saved)와 지금 목록을 비교해
// 지운 것 → DELETE, 새로 넣은 것 → POST, 숙련도가 바뀐 것 → PATCH 를 차례로 보낸다.
// - 경력·프로젝트에서 쓰는 기술은 서버가 삭제를 거부한다(409 IN_USE + 사용처). 그 기술을 목록에 되돌리고 어디서 쓰는지 안내창을 띄운다
// - 저장하지 않고 새로고침·탭 닫기를 하면 브라우저가 경고한다
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/shared/api/client";
import { isProblem, problemMessage } from "@/shared/api/problem";
import { useRegisterSave } from "@/shared/layout/PendingSave";
import { routes } from "@/shared/routes";
import { Button, IconButton } from "@/shared/ui/Button";
import { Callout, Note } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { cx } from "@/shared/ui/cx";
import { Dialog } from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { Table } from "@/shared/ui/Table";
import { useFocusAfterRender } from "@/shared/useFocusAfterRender";
import { OnboardingActions } from "@/features/onboarding/OnboardingActions";
import { LEVELS, type CatalogSkill, type Category, type MySkill } from "./skill";
import styles from "./Skills.module.css";

// 서버에 마지막으로 저장된 내 기술 (기술 이름 → 서버 번호·카테고리·숙련도)
type Saved = Record<string, Required<Pick<MySkill, "id">> & Omit<MySkill, "id">>;

// 지우려 했지만 서버가 거부한 기술과 그 사용처
type Blocked = { name: string; usages: { label: string; href: string }[] };

type SkillsBoardProps = {
  initialSkills: MySkill[];
  reviewId?: string; // S05 검토 중에 왔으면 그 프로젝트 번호 (아래 버튼이 "검토로 돌아가기"가 됨)
};

function toSaved(skills: MySkill[]): Saved {
  return Object.fromEntries(skills.filter((s) => s.id !== undefined).map((s) => [s.name, { ...s, id: s.id! }]));
}

export function SkillsBoard({ initialSkills, reviewId }: SkillsBoardProps) {
  const [skills, setSkills] = useState(initialSkills);
  const [saved, setSaved] = useState(() => toSaved(initialSkills));
  const [blocked, setBlocked] = useState<Blocked[] | null>(null); // 있으면 "지울 수 없어요" 안내창
  const [saveError, setSaveError] = useState<string | null>(null);
  const focusAfter = useFocusAfterRender();

  const [query, setQuery] = useState("");
  // 마지막으로 받은 검색 결과. q 가 지금 검색어와 다르면 아직 찾는 중이다
  const [search, setSearch] = useState<{ q: string; results: CatalogSkill[] | "error" } | null>(null);

  const has = (name: string) => skills.some((s) => s.name === name);

  // 마지막 저장과 비교한 변경
  const removed = Object.values(saved).filter((s) => !has(s.name));
  const added = skills.filter((s) => !saved[s.name]);
  const changed = skills.filter((s) => saved[s.name] && saved[s.name].level !== s.level);
  const dirty = removed.length + added.length + changed.length > 0;

  // 저장하지 않은 변경이 있으면 새로고침·탭 닫기 전에 브라우저가 확인을 묻는다
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // 검색창: 입력이 0.2초 멈추면 서버 자동완성에 묻는다. 그 사이 새로 입력하면 앞의 요청 결과는 버린다
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let stale = false;
    const timer = setTimeout(() => {
      api.GET("/api/skills", { params: { query: { query: q } } }).then(({ data }) => {
        if (stale) return;
        setSearch({ q, results: data ? data.map((s) => ({ name: s.name, category: s.category })) : "error" });
      });
    }, 200);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  // 새 기술은 "학습 중"(1)으로 추가한다 (디자인 skills.js 와 같음). 저장 전에 지웠다가 다시 넣으면 원래 상태로 돌아온다
  function add(name: string, cat: Category) {
    if (has(name)) return;
    setSkills((prev) => [...prev, saved[name] ?? { name, category: cat, level: 1 }]);
  }

  function remove(name: string) {
    // 지운 뒤 다음 줄(마지막이었으면 윗줄)의 삭제 버튼으로, 다 지웠으면 검색칸으로 커서를 옮긴다 (FE-16)
    const index = skills.findIndex((s) => s.name === name);
    const left = skills.length - 1;
    focusAfter(left === 0 ? "skill-search" : `skill-del-${Math.min(index, left - 1)}`);
    setSkills((prev) => prev.filter((s) => s.name !== name));
  }

  // 바꾼 것을 서버에 보낸다. 모두 성공하면 true. 하나라도 안 되면 된 것까지만 저장된 것으로 기억하고 false
  async function save() {
    setSaveError(null);
    const next = { ...saved };
    const refused: Blocked[] = [];
    let failure: string | null = null;
    const fail = (error: unknown) => (failure ??= problemMessage(error, "기술스택을 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."));

    for (const s of removed) {
      const { error, response } = await api.DELETE("/api/me/skills/{userSkillId}", { params: { path: { userSkillId: s.id } } });
      if (!error || response.status === 404) delete next[s.name]; // 404: 이미 지워져 있음
      else if (response.status === 409 && isProblem(error) && error.usages) {
        refused.push({
          name: s.name,
          usages: error.usages.map((u) =>
            u.type === "career"
              ? { label: `${u.name} 경력`, href: routes.career } // 경력 화면은 주소로 특정 경력을 열 수 없다
              : { label: `${u.name} 프로젝트`, href: routes.project(String(u.id)) },
          ),
        });
      } else fail(error);
    }
    for (const s of added) {
      const { data, error } = await api.POST("/api/me/skills", { body: { name: s.name, category: s.category, level: s.level } });
      if (data) next[s.name] = { id: data.id, name: data.name, category: data.category, level: data.level };
      else fail(error);
    }
    for (const s of changed) {
      const { data, error } = await api.PATCH("/api/me/skills/{userSkillId}", {
        params: { path: { userSkillId: saved[s.name].id } },
        body: { level: s.level },
      });
      if (data) next[s.name] = { ...next[s.name], level: data.level };
      else fail(error);
    }

    setSaved(next);
    // 새로 저장한 기술에 서버 번호를 붙이고, 지우지 못한 기술은 목록 끝에 되돌린다
    setSkills((prev) => [
      ...prev.map((s) => (next[s.name] ? { ...s, id: next[s.name].id } : s)),
      ...refused.filter((b) => !prev.some((s) => s.name === b.name)).map((b) => next[b.name]),
    ]);
    if (refused.length) setBlocked(refused);
    if (failure) setSaveError(failure);
    return !refused.length && !failure;
  }

  useRegisterSave(save); // 머리글 "저장하고 나중에 하기"도 이 저장을 쓴다

  // 검색어가 있을 때만 결과 칩을 보여 준다
  const q = query.trim();
  const searching = q !== "" && search?.q !== q;
  const list = searching || !search ? [] : search.results;

  return (
    <>
      <Card aria-labelledby="add-title">
        <h2 id="add-title" className={styles.cardTitle}>
          기술 추가
        </h2>

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
            {q
              ? searching
                ? `"${q}" 찾는 중…`
                : `"${q}" 검색 결과 ${list === "error" ? 0 : list.length}개`
              : "기술 이름을 입력하면 표준 사전에서 찾아 줘요"}
          </span>
          {!q || searching ? null : list === "error" ? (
            <p className={styles.empty}>기술 목록을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.</p>
          ) : list.length === 0 ? (
            <p className={styles.empty}>표준 사전에서 찾지 못했어요. 다른 이름으로 검색해 보세요.</p>
          ) : (
            <div className={styles.row}>
              {list.map((chip) =>
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
              <th scope="col" style={{ width: "40%" }}>
                기술
              </th>
              <th scope="col" style={{ width: "52%" }}>
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
        <Note>바꾼 내용은 아래 버튼으로 이 화면을 나갈 때 한 번에 저장돼요.</Note>
      </Card>

      {saveError && (
        <Callout tone="bad" icon="alert" role="alert">
          {saveError}
        </Callout>
      )}
      <OnboardingActions
        prev={{ href: routes.start }}
        next={{ href: routes.career, label: "다음: 경력 입력" }}
        reviewId={reviewId}
        save={save}
      />

      <Dialog
        open={blocked !== null}
        onClose={() => setBlocked(null)}
        title={blocked?.length === 1 ? `‘${blocked[0].name}’ 기술은 지울 수 없어요` : "지울 수 없는 기술이 있어요"}
        actions={<Button onClick={() => setBlocked(null)}>닫기</Button>}
      >
        <p>아래에서 쓰고 있어서 목록에 다시 넣었어요. 그곳에서 이 기술을 먼저 빼면 지울 수 있어요. 나머지 변경은 저장했어요.</p>
        {blocked?.map((b) => (
          <div key={b.name}>
            {blocked.length > 1 && <strong>{b.name}</strong>}
            <ul className={styles.usageList}>
              {b.usages.map((u) => (
                <li key={u.href + u.label}>
                  <Link href={u.href}>{u.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Dialog>
    </>
  );
}
