"use client";

// S07 의 움직이는 부분: 양식 전체 값, 검증, 입력 현황, "적합도 분석하기".
// 오류 요약(화면 위)·입력 현황(오른쪽)·버튼 안내(아래)가 모두 양식 전체 값을 봐야 해서, 값은 여기 한곳에서 든다.
// 검증 메시지는 "적합도 분석하기"를 처음 눌렀을 때부터 보여 주고, 그 뒤로는 고칠 때마다 바로 갱신한다 (기획서 F4).
//
// 저장 (FE 결정 2026-10-26, C-02 S07 확인할 것 1·2 — S04 와 같은 "떠날 때만 자동"):
//   서버에 저장한다. 이 화면 밖으로 가는 링크(취소·머리글 등)나 "적합도 분석하기"를 누를 때 바뀐 것이 있으면 먼저 저장.
//   새 공고는 처음 저장할 때 만들고(POST /api/job-postings) 주소를 /apply/{번호}/jd 로 바꾼다. 아무것도 안 쓴 새 공고는 만들지 않는다.
// 분석 (확인할 것 5 "S07에서 기다리기"): 저장 → POST /analyses(202 jobId) → 양식을 잠그고 기다렸다가 끝나면 S08 로.
//   실패하면 이유와 "다시 시도". 서버 검증에 걸리면(400 + violations) 오류를 펼쳐 보여 준다 (서버 규칙 = 화면 규칙, 확인할 것 3)
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { aiFailureMessage, waitForAiJob } from "@/shared/api/aiJob";
import { api } from "@/shared/api/client";
import { problemMessage } from "@/shared/api/problem";
import { routes } from "@/shared/routes";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Card, CardTitle } from "@/shared/ui/Card";
import { Field, Input, Textarea, fieldErrorId } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { StateCard, StateText } from "@/shared/ui/StateCard";
import { useSaveOnLeave } from "@/shared/useSaveOnLeave";
import { EMPTY_JD, sameJd, toJdDraft, toPostingRequest, type JdDraft } from "./jd";
import { LineList, type LineListProps } from "./LineList";
import { MESSAGES, filledLines, lineError, type Line } from "./lines";
import styles from "./Jd.module.css";

type ListKey = "required" | "preferred" | "duties";

// 목록 칸 3개의 글자들 (원본: design/assets/js/jd.js 의 SECTIONS)
const SECTIONS: (Pick<LineListProps, "title" | "required" | "where" | "desc" | "placeholder" | "addLabel"> & { key: ListKey })[] = [
  {
    key: "required",
    title: "필수사항",
    required: true,
    where: "적합도 판정의 기준",
    desc: "공고의 ‘자격 요건’, ‘필수 사항’을 한 줄에 하나씩 적어 주세요.",
    placeholder: "예: Java/Spring 기반 개발 경력 3년 이상",
    addLabel: "필수사항 추가",
  },
  {
    key: "preferred",
    title: "우대사항",
    where: "있으면 유리한 조건",
    desc: "공고의 ‘우대 사항’, ‘이런 분이면 더 좋아요’를 한 줄에 하나씩 적어 주세요.",
    placeholder: "예: Kafka 등 메시지 큐 운영 경험",
    addLabel: "우대사항 추가",
  },
  {
    key: "duties",
    title: "주요 업무",
    where: "지원동기 작성에 써요",
    desc: "입사하면 맡게 될 일을 적어 주세요. 적합도 판정에는 쓰지 않아요.",
    placeholder: "예: 결제 승인·정산 시스템 개발 및 운영",
    addLabel: "주요 업무 추가",
  },
];

type JdFormProps = {
  initial: JdDraft;
  guide: ReactNode; // 오른쪽 작성 가이드. 움직이지 않는 부분이라 서버 컴포넌트로 받아 이 자리에 놓는다
};

type Job = { state: "idle" } | { state: "waiting" } | { state: "failed"; message: string };

export function JdForm({ initial, guide }: JdFormProps) {
  const router = useRouter();

  // 줄 번호표. 처음 줄은 "required-0" 처럼 정해진 번호를, 새 줄은 "line-1", "line-2" … 를 준다
  const seq = useRef(0);
  function newLine(text = ""): Line {
    seq.current += 1;
    return { id: `line-${seq.current}`, text };
  }
  const toLines = (key: ListKey) => initial[key].map((text, index) => ({ id: `${key}-${index}`, text }));

  const [company, setCompany] = useState(initial.company);
  const [position, setPosition] = useState(initial.position);
  const [url, setUrl] = useState(initial.url);
  const [intro, setIntro] = useState(initial.intro);
  const [lists, setLists] = useState<Record<ListKey, Line[]>>(() => ({
    required: toLines("required"),
    preferred: toLines("preferred"),
    duties: toLines("duties"),
  }));
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(initial.id === null ? EMPTY_JD : initial); // 서버에 마지막으로 저장된 값
  const [error, setError] = useState<string | null>(null); // 저장·분석 시작 실패 문장
  const [job, setJob] = useState<Job>({ state: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []); // 화면을 떠나면 기다리기를 멈춘다
  // 기다리기가 멈추므로 "분석 중" 표시도 끈다. 안 끄면 뒤로 가기로 돌아왔을 때 양식이 잠긴 채 멈춰 있다 (cacheComponents 는 떠난 화면을 숨겨 둔다)
  useLayoutEffect(() => () => setJob((prev) => (prev.state === "waiting" ? { state: "idle" } : prev)), []);
  const waiting = job.state === "waiting";

  // 지금 양식 값 (저장된 값과 비교하거나 저장할 때)
  const draft: JdDraft = {
    id: saved.id,
    version: saved.version,
    company,
    position,
    url,
    required: lists.required.map((l) => l.text),
    preferred: lists.preferred.map((l) => l.text),
    duties: lists.duties.map((l) => l.text),
    intro,
  };
  const dirty = !sameJd(draft, saved);

  // 오류 세기. 회사명·포지션·필수사항 0개는 각각 1개, 목록은 오류 있는 줄마다 1개
  const companyError = submitted && !company.trim() ? MESSAGES.company : null;
  const positionError = submitted && !position.trim() ? MESSAGES.position : null;
  const counts = {
    required: filledLines(lists.required).length,
    preferred: filledLines(lists.preferred).length,
    duties: filledLines(lists.duties).length,
  };
  const lineErrors = SECTIONS.reduce((sum, { key }) => sum + lists[key].filter((line) => lineError(lists[key], line)).length, 0);
  const isValid = !!company.trim() && !!position.trim() && counts.required > 0 && lineErrors === 0;
  const errorCount = submitted ? [companyError, positionError, counts.required === 0].filter(Boolean).length + lineErrors : 0;

  // 처음 눌렀을 때 첫 번째 오류 칸으로 커서를 옮긴다. 오류 표시가 그려진 다음이어야 해서 effect 에서 한다
  const formRef = useRef<HTMLDivElement>(null);
  const [focusErrorTick, setFocusErrorTick] = useState(0);
  useEffect(() => {
    if (focusErrorTick === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusErrorTick]);

  // 바뀐 것이 있으면 서버에 저장. 저장된 공고 번호를 돌려준다(실패하면 null)
  async function save(): Promise<number | null> {
    if (!dirty) return saved.id;
    setError(null);
    const body = toPostingRequest(draft);
    const result =
      saved.id === null
        ? await api.POST("/api/job-postings", { body })
        : await api.PUT("/api/job-postings/{postingId}", { params: { path: { postingId: saved.id } }, body });
    if (!result.data) {
      setError(problemMessage(result.error, "공고를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
      return null;
    }
    const next = toJdDraft(result.data);
    if (saved.id === null) window.history.replaceState(null, "", routes.jd(String(next.id))); // 새 공고: 주소에 번호를 붙인다
    setSaved(next); // 화면의 줄은 그대로 두고 "저장된 값"만 바꾼다 (줄 번호·커서가 흔들리지 않게)
    return next.id;
  }

  // 이 화면 밖으로 가는 링크를 누르면 먼저 저장 (분석을 기다리는 중에는 하지 않음)
  useSaveOnLeave(dirty && !waiting, async () => (await save()) !== null);

  async function analyze() {
    if (!isValid) {
      setSubmitted(true);
      setFocusErrorTick((tick) => tick + 1);
      return;
    }
    const id = await save();
    if (id === null) return;
    setError(null);
    setJob({ state: "waiting" });
    const { data, error: problem, response } = await api.POST("/api/job-postings/{postingId}/analyses", { params: { path: { postingId: id } } });
    if (!data) {
      // 서버 검증(400 + violations): 화면 규칙과 같아서 오류 표시를 켜면 같은 곳이 빨갛게 보인다
      if (response.status === 400) {
        setSubmitted(true);
        setFocusErrorTick((tick) => tick + 1);
      }
      setJob({ state: "idle" });
      setError(problemMessage(problem, "분석을 시작하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const done = await waitForAiJob(data.jobId, controller.signal);
    if (!done) return; // 화면을 떠남
    if (done.status === "completed") router.push(routes.report(String(id)));
    else setJob({ state: "failed", message: aiFailureMessage(done.failureCode) });
  }

  return (
    <div ref={formRef} className={styles.form}>
      {error && (
        <Callout tone="bad" icon="alert" role="alert">
          {error}
        </Callout>
      )}
      {errorCount > 0 && (
        <Callout tone="bad" icon="alert" role="alert">
          <strong>고쳐야 할 항목이 {errorCount}개 있어요.</strong> 빨간색으로 표시된 곳을 확인해 주세요.
        </Callout>
      )}

      {/* 분석을 기다리는 동안은 고칠 수 없다 */}
      <fieldset disabled={waiting} className={styles.split}>
        <div className={styles.main}>
          <Card aria-labelledby="basic-title">
            <CardTitle id="basic-title">기본 정보</CardTitle>
            <div className={styles.grid2}>
              <Field id="company" label="회사명" required error={companyError}>
                <Input
                  id="company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="예: OO페이"
                  invalid={!!companyError}
                  aria-describedby={companyError ? fieldErrorId("company") : undefined}
                />
              </Field>
              <Field id="position" label="포지션" required error={positionError}>
                <Input
                  id="position"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  placeholder="예: 백엔드 개발자"
                  invalid={!!positionError}
                  aria-describedby={positionError ? fieldErrorId("position") : undefined}
                />
              </Field>
              <div className={styles.span2}>
                <Field id="url" label="공고 링크" hint="(선택 · 나중에 다시 보기용)">
                  <Input id="url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" />
                </Field>
              </div>
            </div>
          </Card>

          {SECTIONS.map(({ key, ...section }) => (
            <LineList
              key={key}
              name={key}
              {...section}
              lines={lists[key]}
              onChange={(lines) => setLists((prev) => ({ ...prev, [key]: lines }))}
              newLine={newLine}
              showErrors={submitted}
            />
          ))}

          <Card aria-labelledby="intro-title" className={styles.listCard}>
            <div className={styles.between}>
              <h2 id="intro-title" className={styles.cardTitle}>
                회사 소개·인재상 <span className={styles.optional}>(선택)</span>
              </h2>
              <span className={styles.meta}>지원동기 작성에 써요</span>
            </div>
            {/* 디자인처럼 설명 문장 자체를 입력칸의 라벨로 쓴다 */}
            <label htmlFor="intro" className={styles.cardDesc}>
              회사가 하는 일, 팀 소개, 인재상처럼 지원동기에 참고할 내용을 자유롭게 적어 주세요.
            </label>
            <Textarea
              id="intro"
              rows={4}
              value={intro}
              onChange={(event) => setIntro(event.target.value)}
              placeholder="예: 온라인 결제와 정산 서비스를 만드는 핀테크 회사. 인재상: 데이터로 판단하는 사람"
            />
          </Card>
        </div>

        <aside className={styles.side} aria-label="작성 가이드">
          {guide}
          <Card size="sm" aria-labelledby="sum-title" className={styles.sideCard}>
            <h2 id="sum-title" className={styles.sideTitle}>
              입력 현황
            </h2>
            <dl className={styles.status}>
              <dt>필수사항</dt>
              <dd>{counts.required}개</dd>
              <dt>우대사항</dt>
              <dd>{counts.preferred}개</dd>
              <dt>주요 업무</dt>
              <dd>{counts.duties}개</dd>
            </dl>
            <p className={styles.meta}>입력한 내용은 이 화면을 나가거나 분석을 시작할 때 자동으로 저장돼요.</p>
          </Card>
        </aside>
      </fieldset>

      {job.state === "waiting" && (
        <StateCard tone="wait" title="공고와 내 경험을 맞춰 보고 있어요">
          <StateText>요건마다 내 경험에서 근거를 찾아 판정하고 있어요. 보통 20초쯤 걸려요. 끝나면 적합도 리포트로 넘어가요.</StateText>
        </StateCard>
      )}
      {job.state === "failed" && (
        <StateCard tone="bad" title="분석을 마치지 못했어요">
          <StateText>{job.message} 입력한 공고는 그대로 저장돼 있어요.</StateText>
        </StateCard>
      )}

      <div className={styles.actions} hidden={waiting}>
        {/* 공고 목록(S10)에서 "새 공고"로 들어오므로 그곳으로 돌아간다. 디자인은 library.html (C-02 S07에 기록) */}
        <ButtonLink href={routes.applyList}>취소</ButtonLink>
        <div className={styles.submit}>
          <span className={styles.meta}>
            {isValid
              ? `필수사항 ${counts.required}개, 우대사항 ${counts.preferred}개로 분석해요.`
              : "회사명, 포지션, 필수사항 1개 이상이 필요해요."}
          </span>
          <Button variant="primary" onClick={analyze}>
            {job.state === "failed" ? "다시 시도" : "적합도 분석하기"} <Icon name="arrow" />
          </Button>
        </div>
      </div>
    </div>
  );
}
