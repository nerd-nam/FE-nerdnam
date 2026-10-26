"use client";

// S03 의 움직이는 부분: 왼쪽 경력 목록 + 오른쪽 양식 + 아래 이전/다음 버튼.
// 목록은 페이지가 서버에서 가져와 넘겨준다(GET /api/me/careers). 양식은 "저장"을 눌러야 서버에 보낸다(POST·PUT).
//
// 저장하지 않은 변경 (FE 결정 2026-10-26, C-02 S03 확인할 것 1):
// 양식을 고친 채 다른 경력·"경력 추가"·이전·다음·건너뛰기·머리글 "저장하고 나중에 하기"를 누르면
// 확인창에서 "저장하고 이동 / 버리고 이동 / 취소"를 고른다. 새로고침·탭 닫기는 브라우저가 경고한다.
// 삭제 거부 (확인할 것 5): 프로젝트가 연결된 경력은 서버가 409 IN_USE 로 거부한다 → 연결된 프로젝트(S04 링크)를 보여 준다.
import Link from "next/link";
import { useEffect, useState } from "react";
import { OnboardingActions } from "@/features/onboarding/OnboardingActions";
import { api } from "@/shared/api/client";
import { isProblem, problemMessage } from "@/shared/api/problem";
import { useRegisterSave } from "@/shared/layout/PendingSave";
import { NEW_PROJECT_ID, routes } from "@/shared/routes";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { Dialog } from "@/shared/ui/Dialog";
import { Field, fieldErrorId, Input, Select } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { PeriodField, periodErrors } from "@/shared/ui/PeriodField";
import { useFocusAfterRender } from "@/shared/useFocusAfterRender";
import {
  EMPLOYMENT_TYPES,
  MAX_DUTIES,
  emptyCareer,
  formatMonth,
  requiredErrors,
  sameCareer,
  toCareer,
  toRequest,
  type Career,
  type EmploymentType,
} from "./career";
import styles from "./Career.module.css";

type SkillOption = { id: number; name: string }; // 내 기술스택 (userSkillId, 이름)
type Selected = number | "new"; // 고른 경력 번호, 또는 새 경력

type CareerBoardProps = {
  initialCareers: Career[];
  mySkills: SkillOption[];
  reviewId?: string; // S05 검토 중에 왔으면 그 프로젝트 번호 (아래 버튼이 "검토로 돌아가기"가 됨)
};

export function CareerBoard({ initialCareers, mySkills, reviewId }: CareerBoardProps) {
  const [careers, setCareers] = useState(initialCareers);
  const [selectedId, setSelectedId] = useState<Selected>(initialCareers[0]?.id ?? "new");
  const base = careers.find((c) => c.id === selectedId) ?? emptyCareer(); // 저장된 값 (새 경력이면 빈 양식)
  const [draft, setDraft] = useState(base); // 양식에서 고치는 중인 값
  const [triedSave, setTriedSave] = useState(false); // 저장을 한 번 누른 뒤부터 칸 오류를 모두 보여 준다
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState(false); // "저장했어요"
  const [formError, setFormError] = useState<string | null>(null); // 서버 오류 문장
  const [leaving, setLeaving] = useState<((go: boolean) => void) | null>(null); // 있으면 "저장하지 않은 내용" 확인창
  const [blocked, setBlocked] = useState<{ label: string; href: string }[] | null>(null); // 있으면 삭제 거부 안내창
  const focusAfter = useFocusAfterRender();

  const dirty = !sameCareer(draft, base);
  const required = requiredErrors(draft);
  const period = periodErrors({ start: draft.start, end: draft.end }, true);
  const invalid = Object.values(required).some(Boolean) || Object.values(period).some(Boolean);

  // 저장하지 않은 변경이 있으면 새로고침·탭 닫기 전에 브라우저가 확인을 묻는다
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // 고른 경력을 바꾸고 양식을 그 값으로 다시 채운다
  function show(id: Selected, list = careers) {
    setSelectedId(id);
    setDraft(list.find((c) => c.id === id) ?? emptyCareer());
    setTriedSave(false);
    setSavedNote(false);
    setFormError(null);
  }

  // 떠나도 되는지: 변경이 없으면 바로 true, 있으면 확인창의 답을 기다린다
  function confirmLeave() {
    if (!dirty) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => setLeaving(() => resolve));
  }

  async function select(id: Selected) {
    if (id === selectedId) return;
    if (await confirmLeave()) show(id);
  }

  // 이전·다음·건너뛰기·머리글 "저장하고 나중에 하기"도 같은 확인을 거친다
  useRegisterSave(confirmLeave);

  // 서버에 저장. 성공하면 true
  async function save() {
    setTriedSave(true);
    setSavedNote(false);
    setFormError(null);
    if (invalid) return false; // 칸 오류는 양식에 보인다
    setSaving(true);
    const body = toRequest(draft);
    const result =
      draft.id === null
        ? await api.POST("/api/me/careers", { body })
        : await api.PUT("/api/me/careers/{careerId}", { params: { path: { careerId: draft.id } }, body });
    setSaving(false);
    if (!result.data) {
      // 409: 그사이 다른 곳(다른 탭 등)에서 먼저 고침. 서버 문장을 보여 준다
      setFormError(problemMessage(result.error, "경력을 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
      return false;
    }
    const saved = toCareer(result.data);
    const next = draft.id === null ? [saved, ...careers] : careers.map((c) => (c.id === saved.id ? saved : c));
    setCareers(next);
    setSelectedId(saved.id!);
    setDraft(saved);
    setSavedNote(true);
    return true;
  }

  async function remove() {
    if (draft.id === null) return;
    setFormError(null);
    const { error, response } = await api.DELETE("/api/me/careers/{careerId}", { params: { path: { careerId: draft.id } } });
    if (response.status === 409 && isProblem(error) && error.usages) {
      setBlocked(error.usages.map((u) => ({ label: `${u.name} 프로젝트`, href: routes.project(String(u.id)) })));
      return;
    }
    if (error && response.status !== 404) {
      setFormError(problemMessage(error, "경력을 삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
      return;
    }
    const rest = careers.filter((c) => c.id !== draft.id);
    // 지운 뒤 새로 고른 경력 카드(없으면 "경력 추가")로 커서를 옮긴다 (FE-16)
    focusAfter(rest[0] ? `career-item-${rest[0].id}` : "career-add");
    setCareers(rest);
    show(rest[0]?.id ?? "new", rest);
  }

  function set<K extends keyof Career>(key: K, value: Career[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSavedNote(false);
  }

  const toggleSkill = (id: number) => set("skillIds", draft.skillIds.includes(id) ? draft.skillIds.filter((s) => s !== id) : [...draft.skillIds, id]);
  const showError = (message: string | null) => (triedSave ? message : null);

  return (
    <>
      <div className={styles.split}>
        <section className={styles.side} aria-labelledby="career-list">
          <h2 id="career-list" className={styles.listTitle}>
            경력 {careers.length}건
          </h2>
          {careers.map((c) => (
            <button
              key={c.id}
              id={`career-item-${c.id}`}
              type="button"
              className={styles.item}
              aria-pressed={c.id === selectedId}
              onClick={() => select(c.id!)}
            >
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
          <Button id="career-add" block className={styles.addItem} onClick={() => select("new")} aria-pressed={selectedId === "new"}>
            <Icon name="plus" />
            경력 추가
          </Button>
        </section>

        <Card size="lg" className={styles.main} aria-labelledby="form-title">
          <h2 id="form-title" className={styles.formTitle}>
            {draft.id === null ? "새 경력" : base.company || "(회사명 없음)"}
          </h2>

          <div className={styles.grid2}>
            <Field id="company" label="회사명" required error={showError(required.company)}>
              <Input
                id="company"
                value={draft.company}
                invalid={!!showError(required.company)}
                aria-describedby={showError(required.company) ? fieldErrorId("company") : undefined}
                onChange={(e) => set("company", e.target.value)}
              />
            </Field>
            <Field id="team" label="부서" required error={showError(required.team)}>
              <Input
                id="team"
                value={draft.team}
                invalid={!!showError(required.team)}
                aria-describedby={showError(required.team) ? fieldErrorId("team") : undefined}
                onChange={(e) => set("team", e.target.value)}
              />
            </Field>
            <Field id="job-title" label="직무" required error={showError(required.jobTitle)}>
              <Input
                id="job-title"
                value={draft.jobTitle}
                invalid={!!showError(required.jobTitle)}
                aria-describedby={showError(required.jobTitle) ? fieldErrorId("job-title") : undefined}
                onChange={(e) => set("jobTitle", e.target.value)}
              />
            </Field>
            <Field id="position" label="직급" hint="(선택)">
              <Input id="position" value={draft.position} onChange={(e) => set("position", e.target.value)} />
            </Field>
            <Field id="employment-type" label="고용형태">
              <Select id="employment-type" value={draft.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
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
              onChange={(p) => setDraft((prev) => ({ ...prev, start: p.start, end: p.end }))}
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
              {mySkills.map((s) => {
                const isOn = draft.skillIds.includes(s.id);
                return (
                  <Chip key={s.id} variant="accent" pressed={isOn} onClick={() => toggleSkill(s.id)}>
                    {isOn && <Icon name="check" size="sm" bold />}
                    {s.name}
                  </Chip>
                );
              })}
            </div>
          </fieldset>

          {formError && (
            <Callout tone="bad" icon="alert" role="alert">
              {formError}
            </Callout>
          )}
          <div className={styles.formFoot}>
            {savedNote && (
              <span className={styles.saved} role="status">
                저장했어요
              </span>
            )}
            {draft.id !== null && (
              <Button variant="danger" onClick={remove}>
                삭제
              </Button>
            )}
            <Button disabled={saving} onClick={save}>
              {saving ? "저장하는 중…" : "저장"}
            </Button>
          </div>
        </Card>
      </div>

      <OnboardingActions
        prev={{ href: routes.skills }}
        next={{ href: routes.project(NEW_PROJECT_ID), label: "다음: 프로젝트 입력" }}
        reviewId={reviewId}
        save={confirmLeave}
      />

      {/* 저장하지 않은 내용이 있을 때 떠나려 하면 */}
      <Dialog
        open={leaving !== null}
        onClose={() => {
          leaving?.(false);
          setLeaving(null);
        }}
        title="저장하지 않은 내용이 있어요"
        actions={
          <>
            <Button
              onClick={() => {
                leaving?.(false);
                setLeaving(null);
              }}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                setDraft(base); // 고친 것을 버린다
                leaving?.(true);
                setLeaving(null);
              }}
            >
              버리고 이동
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                const resolve = leaving;
                setLeaving(null);
                resolve?.(await save()); // 저장에 실패하면 머물고, 양식에 오류가 보인다
              }}
            >
              저장하고 이동
            </Button>
          </>
        }
      >
        <p>{draft.company.trim() || "이 경력"}에서 고친 내용을 저장하지 않았어요. 저장할까요?</p>
      </Dialog>

      {/* 프로젝트가 연결된 경력을 지우려 할 때 (ADR-0002 Q8) */}
      <Dialog
        open={blocked !== null}
        onClose={() => setBlocked(null)}
        title="이 경력은 지울 수 없어요"
        actions={<Button onClick={() => setBlocked(null)}>닫기</Button>}
      >
        <p>아래 프로젝트가 이 경력에 연결돼 있어요. 프로젝트 소속을 개인으로 바꾸면 지울 수 있어요.</p>
        <ul className={styles.usageList}>
          {blocked?.map((u) => (
            <li key={u.href}>
              <Link href={u.href}>{u.label}</Link>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
