"use client";

// S03 의 움직이는 부분: 왼쪽 경력 목록 + 오른쪽 양식.
// 목록(careers)과 "지금 고르고 있는 경력(selectedId)"은 여기서 들고, 양식에서 고치는 중인 값은 CareerForm 이 따로 든다.
// 그래서 "저장"을 눌러야 목록에 반영된다 (디자인처럼 저장 버튼이 있는 화면).
import { useState } from "react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { Field, Input, Select } from "@/shared/ui/Field";
import { PeriodField, periodErrors } from "@/shared/ui/PeriodField";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { EMPLOYMENT_TYPES, MAX_DUTIES, emptyCareer, formatMonth, type Career, type EmploymentType } from "./mock";
import styles from "./Career.module.css";

type CareerBoardProps = { initialCareers: Career[]; mySkills: string[] };

export function CareerBoard({ initialCareers, mySkills }: CareerBoardProps) {
  const [careers, setCareers] = useState(initialCareers);
  const [selectedId, setSelectedId] = useState(initialCareers[0]?.id ?? "new");
  const selected = careers.find((c) => c.id === selectedId) ?? emptyCareer();

  function save(next: Career) {
    if (next.id === "new") {
      // 실제로는 서버가 번호를 만든다 (④). 지금은 임시 번호
      const created = { ...next, id: `c_${Date.now()}` };
      setCareers((prev) => [created, ...prev]);
      setSelectedId(created.id);
    } else {
      setCareers((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    }
  }

  function remove(id: string) {
    // 프로젝트가 연결된 경력은 서버가 삭제를 거부하고 소속을 바꾸도록 안내한다 (ADR-0002 Q8). 그 안내는 ④ 단계에서
    const rest = careers.filter((c) => c.id !== id);
    setCareers(rest);
    setSelectedId(rest[0]?.id ?? "new");
  }

  return (
    <div className={styles.split}>
      <section className={styles.side} aria-labelledby="career-list">
        <h2 id="career-list" className={styles.listTitle}>
          경력 {careers.length}건
        </h2>
        {careers.map((c) => (
          <button key={c.id} type="button" className={styles.item} aria-pressed={c.id === selectedId} onClick={() => setSelectedId(c.id)}>
            <span className={styles.itemTop}>
              <strong className={styles.company}>{c.company || "(회사명 없음)"}</strong>
              {c.end === null && <Badge tone="info">재직 중</Badge>}
            </span>
            <span className={styles.desc}>{[c.team, c.jobTitle].filter(Boolean).join(" · ")}</span>
            <span className={styles.period}>
              {formatMonth(c.start)} – {c.end ? formatMonth(c.end) : "현재"}
            </span>
          </button>
        ))}
        <Button block className={styles.addItem} onClick={() => setSelectedId("new")} aria-pressed={selectedId === "new"}>
          <Icon name="plus" />
          경력 추가
        </Button>
      </section>

      {/* key: 다른 경력을 고르면 양식을 새로 만든다. 없으면 고치던 값이 다음 경력에 남는다 (저장하지 않은 값은 버림, C-02 S03 확인할 것 1번) */}
      <CareerForm key={selectedId} career={selected} mySkills={mySkills} onSave={save} onDelete={remove} />
    </div>
  );
}

type CareerFormProps = {
  career: Career;
  mySkills: string[];
  onSave: (career: Career) => void;
  onDelete: (id: string) => void;
};

function CareerForm({ career, mySkills, onSave, onDelete }: CareerFormProps) {
  const [draft, setDraft] = useState(career);
  const [saved, setSaved] = useState(false);
  const [triedSave, setTriedSave] = useState(false); // 저장을 한 번 누른 뒤부터 기간 오류를 모두 보여 준다
  const isNew = career.id === "new";
  const periodError = Object.values(periodErrors({ start: draft.start, end: draft.end }, true)).some(Boolean);

  // 칸 하나를 바꾸는 함수. 바꾸면 "저장했어요" 표시를 지운다
  function set<K extends keyof Career>(key: K, value: Career[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  const toggleSkill = (name: string) =>
    set("skills", draft.skills.includes(name) ? draft.skills.filter((s) => s !== name) : [...draft.skills, name]);

  return (
    <Card size="lg" className={styles.main} aria-labelledby="form-title">
      <h2 id="form-title" className={styles.formTitle}>
        {isNew ? "새 경력" : draft.company || "(회사명 없음)"}
      </h2>

      <div className={styles.grid2}>
        <Field id="company" label="회사명">
          <Input id="company" value={draft.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
        <Field id="team" label="부서">
          <Input id="team" value={draft.team} onChange={(e) => set("team", e.target.value)} />
        </Field>
        <Field id="job-title" label="직무">
          <Input id="job-title" value={draft.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
        </Field>
        <Field id="position" label="직급" hint="(선택)">
          <Input id="position" value={draft.position} onChange={(e) => set("position", e.target.value)} />
        </Field>
        <Field id="employment-type" label="고용형태">
          <Select id="employment-type" value={draft.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)}>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        {/* 재직기간: 직접 입력 + 달력으로 고르기 (Safari 에서 기본 월 선택 칸이 동작하지 않아 공용 칸으로 바꿈).
            재직 중이면 종료 월을 막는다 (FE-06). 연차 계산에 쓰여서 필수다 (기획서 4.2) */}
        <PeriodField
          id="career"
          label="재직기간"
          required
          ongoingLabel="재직 중"
          value={{ start: draft.start, end: draft.end }}
          onChange={(period) => {
            set("start", period.start);
            set("end", period.end);
          }}
          showErrors={triedSave}
        />
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          주요 업무{" "}
          <span className={styles.hint}>
            {draft.duties.length} / {MAX_DUTIES}줄
          </span>
        </legend>
        {draft.duties.map((duty, index) => (
          <div key={index} className={styles.dutyRow}>
            <span className={styles.dutyNum}>{index + 1}</span>
            <label htmlFor={`duty-${index}`} className="sr-only">
              주요 업무 {index + 1}
            </label>
            <Input
              id={`duty-${index}`}
              value={duty}
              placeholder="한 줄에 업무 하나씩 적어 주세요"
              onChange={(e) => set("duties", draft.duties.map((d, i) => (i === index ? e.target.value : d)))}
            />
          </div>
        ))}
        <Button variant="text" className={styles.start} disabled={draft.duties.length >= MAX_DUTIES} onClick={() => set("duties", [...draft.duties, ""])}>
          <Icon name="plus" size="sm" />줄 추가
        </Button>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          <span>
            이 회사에서 쓴 기술 <span className={styles.hint}>· 기술스택에서 선택</span>
          </span>
        </legend>
        <div className={styles.row}>
          {mySkills.map((name) => {
            const isOn = draft.skills.includes(name);
            return (
              <Chip key={name} variant="accent" pressed={isOn} onClick={() => toggleSkill(name)}>
                {isOn && <Icon name="check" size="sm" bold />}
                {name}
              </Chip>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.formFoot}>
        {saved && (
          <span className={styles.saved} role="status">
            저장했어요
          </span>
        )}
        {!isNew && (
          <Button variant="danger" onClick={() => onDelete(career.id)}>
            삭제
          </Button>
        )}
        <Button
          onClick={() => {
            // 기간이 틀리면 저장하지 않고 오류를 보여 준다 (연차 계산에 쓰는 값이라)
            setTriedSave(true);
            if (periodError) return;
            // 빈 줄은 저장하지 않는다. 서버 저장·나머지 필수 항목 검증은 ④ 단계
            onSave({ ...draft, duties: draft.duties.filter((d) => d.trim()) });
            setSaved(true);
          }}
        >
          저장
        </Button>
      </div>
    </Card>
  );
}
