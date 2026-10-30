"use client";

// S04 프로젝트 입력의 움직이는 부분: 양식 + 아래 버튼 줄 (FE-07, C-02 S04).
// 처음 값은 페이지가 서버에서 가져와 넘겨준다(GET /api/projects/{id}). 새 프로젝트(/projects/new)는 빈 양식.
//
// 저장 (FE 결정 2026-10-26, C-02 S04 확인할 것 1 "떠날 때만 자동"):
//   이 화면 밖으로 가는 링크(이전·탭·머리글·단계 표시 등)를 누르거나 "재구성하기"를 누르면, 바뀐 것이 있을 때 먼저 저장한다.
//   새 프로젝트는 처음 저장할 때 만들고(POST /api/projects) 주소를 /projects/{번호}로 바꾼다. 그 뒤로는 PUT + version.
//   저장에 실패하면 이동하지 않고 오류를 보여 준다. 새로고침·탭 닫기는 브라우저가 경고만 한다.
// 재구성 (확인할 것 2 "S04에서 기다리기"):
//   제목·본문이 있어야 한다 → 저장 → POST /split(202 jobId) → 몇 초마다 작업 상태를 묻고(shared/api/aiJob) 끝나면 S05 로.
//   실패하면 이유와 "다시 시도". 새로고침해도 서버가 준 runningJobId 로 이어서 기다린다. 기다리는 동안 양식은 잠근다.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { aiFailureMessage, waitForAiJob } from "@/shared/api/aiJob";
import { api } from "@/shared/api/client";
import { isProblem, problemMessage } from "@/shared/api/problem";
import { routes } from "@/shared/routes";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { Field, fieldErrorId, Input, Select } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { PeriodField, periodErrors } from "@/shared/ui/PeriodField";
import { StateCard, StateText } from "@/shared/ui/StateCard";
import { useSaveOnLeave } from "@/shared/useSaveOnLeave";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { EMPTY_DRAFT, sameDraft, toDraft, toRequest, type AffiliationValue, type ProjectDraft } from "./project";
import { RawTextField } from "./RawTextField";
import { SkillPicker, type SkillOption } from "@/features/skills/SkillPicker";
import styles from "./Project.module.css";

type ProjectEditorProps = {
  initial: ProjectDraft;
  runningJobId: number | null; // 재구성이 돌고 있으면 그 작업 번호 (새로고침해도 이어서 기다린다)
  affiliations: { value: AffiliationValue; label: string }[]; // 소속 선택지: 내 경력 + 개인·팀
  mySkills: SkillOption[];
  guide: ReactNode; // 오른쪽 작성 가이드 (서버 컴포넌트)
};

type Job = { state: "idle" } | { state: "waiting" } | { state: "failed"; message: string };

export function ProjectEditor({ initial, runningJobId, affiliations, mySkills, guide }: ProjectEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial.id === null ? EMPTY_DRAFT : initial); // 서버에 마지막으로 저장된 값
  const [skills, setSkills] = useState(mySkills); // 칩 목록 (새로 추가한 기술이 뒤에 붙는다)
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tried, setTried] = useState(false); // 재구성하기를 한 번 누른 뒤부터 제목·본문·기간 오류를 보여 준다
  const [job, setJob] = useState<Job>(runningJobId !== null ? { state: "waiting" } : { state: "idle" });
  const [deleted, setDeleted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const waiting = job.state === "waiting";
  const dirty = !sameDraft(draft, saved);
  const period = periodErrors({ start: draft.start, end: draft.end || null }, false);
  const periodInvalid = Object.values(period).some(Boolean);
  const titleError = tried && !draft.title.trim() ? "프로젝트 제목을 입력해 주세요." : null;
  const rawTextError = tried && !draft.rawText.trim() ? "무슨 일이 있었는지 본문을 적어 주세요." : null;

  // 바뀐 것이 있으면 서버에 저장. 저장된 프로젝트 번호를 돌려준다(실패하면 null)
  async function save(): Promise<number | null> {
    if (!dirty) return draft.id ?? null;
    setSaveError(null);
    if (periodInvalid) {
      setTried(true);
      setSaveError("기간을 확인해 주세요. 고친 뒤에 저장할 수 있어요.");
      return null;
    }
    const body = toRequest(draft);
    const result =
      draft.id === null
        ? await api.POST("/api/projects", { body })
        : await api.PUT("/api/projects/{projectId}", { params: { path: { projectId: draft.id } }, body });
    if (!result.data) {
      setSaveError(problemMessage(result.error, "프로젝트를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
      return null;
    }
    const next = toDraft(result.data);
    if (draft.id === null) window.history.replaceState(null, "", routes.project(String(next.id))); // 새 프로젝트: 주소에 번호를 붙인다
    setSaved(next);
    setDraft(next);
    return next.id;
  }

  // 이 화면 밖으로 가는 링크를 누르면 먼저 저장 (저장 중·재구성 기다리는 중·지운 뒤에는 하지 않음)
  useSaveOnLeave(dirty && !waiting && !deleted, async () => (await save()) !== null);

  // 작업이 끝날 때까지 기다린 뒤: 완료 → S05, 실패 → 이유 안내
  function wait(jobId: number, projectId: number) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    waitForAiJob(jobId, controller.signal).then((done) => {
      if (!done) return; // 화면을 떠남
      if (done.status === "completed") router.push(routes.review(String(projectId)));
      else setJob({ state: "failed", message: aiFailureMessage(done.failureCode) });
    });
  }

  // 새로고침했거나 다시 들어왔는데 재구성이 돌고 있으면 이어서 기다린다
  const resumedRef = useRef(false);
  useEffect(() => {
    // 처음 그릴 때만. 숨겨 둔 화면이 뒤로 가기로 다시 보일 때도 effect 가 다시 돌지만(cacheComponents),
    // 그때 이어서 기다리면 끝나자마자 S05 로 다시 보내 버린다. 다시 보일 때는 서버가 다시 그려 준 값을 따른다 (RefreshOnHistory)
    if (!resumedRef.current && runningJobId !== null && initial.id !== null) wait(runningJobId, initial.id);
    resumedRef.current = true;
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 화면을 떠나면(숨겨지면) 기다리기가 멈추므로 "나누고 있어요" 표시도 끈다. 안 끄면 뒤로 가기로 돌아왔을 때 양식이 잠긴 채 멈춰 있다
  useLayoutEffect(() => () => setJob((prev) => (prev.state === "waiting" ? { state: "idle" } : prev)), []);

  async function restructure() {
    setTried(true);
    setSaveError(null);
    if (!draft.title.trim() || !draft.rawText.trim()) return; // 칸 아래에 오류가 보인다
    const id = await save();
    if (id === null) return;
    setJob({ state: "waiting" });
    const { data, error, response } = await api.POST("/api/projects/{projectId}/split", { params: { path: { projectId: id } } });
    if (data) return wait(data.jobId, id);
    // 이미 재구성이 돌고 있으면(409 + runningJobId) 그 작업을 이어서 기다린다
    if (response.status === 409 && isProblem(error) && typeof error.runningJobId === "number") return wait(error.runningJobId, id);
    setJob({ state: "failed", message: problemMessage(error, "재구성을 시작하지 못했어요. 잠시 뒤 다시 시도해 주세요.") });
  }

  function set<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <div className={styles.split}>
        <Card size="lg" className={styles.main} aria-label="프로젝트 내용">
          {/* 재구성을 기다리는 동안은 고칠 수 없다 (서버도 검토 중인 원문은 고치지 못하게 한다) */}
          <fieldset disabled={waiting} className={styles.skills}>
            <div className={styles.grid2}>
              <div className={styles.span2}>
                <Field id="title" label="프로젝트 제목" required error={titleError}>
                  <Input
                    id="title"
                    value={draft.title}
                    placeholder="예: 결제 승인 API 성능 개선"
                    invalid={!!titleError}
                    aria-describedby={titleError ? fieldErrorId("title") : undefined}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </Field>
              </div>

              {/* 기간: 직접 입력 + 달력으로 고르기. 필수는 아니다 (C-02 S04 확인할 것 8) */}
              <PeriodField
                id="project"
                label="기간"
                value={{ start: draft.start, end: draft.end }}
                onChange={(p) => setDraft((prev) => ({ ...prev, start: p.start, end: p.end ?? "" }))}
                showErrors={tried}
              />

              <div>
                <Field id="affiliation" label="소속">
                  <Select id="affiliation" value={draft.affiliation} onChange={(e) => set("affiliation", e.target.value as AffiliationValue)}>
                    {draft.affiliation === "" && <option value="">선택해 주세요</option>}
                    {affiliations.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Link href={routes.career} className={styles.inlineLink}>
                  목록에 없는 경력 추가·수정 <Icon name="arrow" size="sm" />
                </Link>
              </div>
            </div>

            <SkillPicker
              legend="이 프로젝트에서 쓴 기술"
              options={skills}
              selected={draft.skillIds}
              onToggle={(id) => set("skillIds", draft.skillIds.includes(id) ? draft.skillIds.filter((s) => s !== id) : [...draft.skillIds, id])}
              onAdded={(skill) => {
                setSkills((prev) => (prev.some((s) => s.id === skill.id) ? prev : [...prev, skill]));
                setDraft((prev) => (prev.skillIds.includes(skill.id) ? prev : { ...prev, skillIds: [...prev.skillIds, skill.id] }));
              }}
            />

            <RawTextField value={draft.rawText} onChange={(v) => set("rawText", v)} error={rawTextError} />

            <div className={styles.grid2}>
              <Field id="repo-url" label="GitHub 링크" hint="(선택)">
                <Input id="repo-url" type="url" placeholder="https://github.com/…" value={draft.repoUrl} onChange={(e) => set("repoUrl", e.target.value)} />
              </Field>
              <Field id="demo-url" label="배포·문서 링크" hint="(선택)">
                <Input id="demo-url" type="url" placeholder="https://…" value={draft.demoUrl} onChange={(e) => set("demoUrl", e.target.value)} />
              </Field>
            </div>

            {/* 이미지 업로드는 받지 않는다 (ADR-0004, 기획서 F1) */}

            {/* 저장된 프로젝트만 지울 수 있다. 새 프로젝트는 아직 저장 전이라 지울 것이 없다 */}
            {draft.id !== null && (
              <div className={styles.formFoot}>
                <DeleteProjectButton projectId={draft.id} title={draft.title} status="draft" onDeleted={() => setDeleted(true)} />
              </div>
            )}
          </fieldset>
        </Card>
        {guide}
      </div>

      {saveError && (
        <Callout tone="bad" icon="alert" role="alert">
          {saveError}
        </Callout>
      )}

      {job.state === "waiting" ? (
        <StateCard tone="wait" title="[문제]-[해결]-[결과]로 나누고 있어요">
          <StateText>본문에서 사례를 찾아 정리하고 있어요. 보통 15초쯤 걸려요. 끝나면 검토 화면으로 넘어가요.</StateText>
        </StateCard>
      ) : (
        <>
          {job.state === "failed" && (
            <StateCard tone="bad" title="재구성을 마치지 못했어요">
              <StateText>{job.message} 적은 내용은 그대로 저장돼 있어요.</StateText>
            </StateCard>
          )}
          <div className={styles.actions}>
            <ButtonLink href={routes.career}>이전</ButtonLink>
            <Button variant="primary" onClick={restructure}>
              <Icon name="restructure" />
              {job.state === "failed" ? "다시 시도" : "[문제]-[해결]-[결과]로 재구성하기"}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
