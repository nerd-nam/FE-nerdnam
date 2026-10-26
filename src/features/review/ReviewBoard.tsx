"use client";

// S05 의 움직이는 부분 전체. 사례 결정·진행률·프로젝트 확정 버튼이 같은 데이터를 봐야 해서 상태를 여기 한곳에 모은다.
// 처음 데이터는 페이지가 서버에서 가져와 넘겨준다(GET /api/projects/{id}/review). 그 뒤로는 버튼마다 브라우저에서 서버에 보낸다(C-02 S05).
// - AI 없이 바로 끝나는 것(확정·제외·다시 검토하기·빼고 진행·이 버전에서 이어서 하기·직접 편집·직접 추가·프로젝트 확정):
//   서버가 바뀐 검토 화면 전체(Review)를 돌려주므로 그것으로 화면을 바꾼다. 누를 때마다 바로 저장 (확인할 것 7)
// - AI 가 하는 것(확인 질문 답변·이 사례 수정 요청·다시 나누기): 202 + jobId → 끝날 때까지 기다린 뒤(shared/api/aiJob) 검토 화면을 다시 가져온다
// - AI 작업이 도는 동안은 서버가 같은 프로젝트의 모든 변경을 막는다(409 AI_JOB_RUNNING). 그래서 화면도 모든 버튼을 막는다(busy)
// 확정한 프로젝트면 읽기 모드 (기획서 v1.17 F2): 확정한 사례만, 결정·버전·질문·다시 나누기·사례 추가 없음, 나갈 때 경고 없음
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { aiFailureMessage, waitForAiJob } from "@/shared/api/aiJob";
import { api } from "@/shared/api/client";
import { isProblem, problemMessage } from "@/shared/api/problem";
import type { components } from "@/shared/api/schema";
import { routes } from "@/shared/routes";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { Textarea } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { Rating } from "@/shared/ui/Rating";
import { StateCard, StateText } from "@/shared/ui/StateCard";
import { cx } from "@/shared/ui/cx";
import { useFocusAfterRender } from "@/shared/useFocusAfterRender";
import { ReregisterButton } from "@/features/library/ReregisterButton";
import { LeaveGuard } from "@/features/onboarding/LeaveGuard";
import { EditForm, EpisodeCard, type EpisodeFields } from "./EpisodeCard";
import { RawTextPanel } from "./RawTextPanel";
import { toReviewData, type ReviewData } from "./review";
import styles from "./Review.module.css";

type ApiResult = { data?: components["schemas"]["Review"]; error?: unknown; response: Response };
type Accepted = { data?: { jobId: number }; error?: unknown; response: Response };

// 기다리는 AI 작업 종류별 안내
const WAIT_TITLE = {
  answer: "답변을 반영해 사례를 고치고 있어요",
  revise: "요청대로 사례를 고치고 있어요",
  resplit: "사례를 다시 나누고 있어요",
  other: "AI가 사례를 정리하고 있어요",
} as const;
type JobKind = keyof typeof WAIT_TITLE;

type ReviewBoardProps = {
  initial: ReviewData;
  rating: { score: number; comment: string } | null; // 내가 남긴 사례 생성 평가 (GET /rating)
};

export function ReviewBoard({ initial, rating }: ReviewBoardProps) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const readOnly = data.projectStatus === "confirmed";
  const episodes = data.episodes;
  const projectId = data.projectId;
  const [openId, setOpenId] = useState<string | null>(initial.episodes[0]?.id ?? null);
  const [viewing, setViewing] = useState<Record<string, number>>({}); // 이전 버전을 보고 있는 사례만 (없으면 현재 버전)
  const [feedback, setFeedback] = useState(""); // 다시 나누기 피드백
  const [adding, setAdding] = useState(false); // "AI가 놓친 사례 직접 추가" 양식
  const [saving, setSaving] = useState(false); // AI 없는 요청을 기다리는 중
  const [waiting, setWaiting] = useState<JobKind | null>(initial.runningJobId !== null ? "other" : null); // AI 작업을 기다리는 중
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const focusAfter = useFocusAfterRender();
  const busy = saving || waiting !== null;

  // ── 서버 응답으로 화면 바꾸기
  function apply(review: components["schemas"]["Review"]) {
    setData(toReviewData(review));
    setViewing({}); // 버전이 바뀌었을 수 있어 보고 있던 이전 버전은 잊는다
  }

  async function reload() {
    const { data: review } = await api.GET("/api/projects/{projectId}/review", { params: { path: { projectId } } });
    if (review) apply(review);
  }

  // AI 작업을 끝까지 기다린 뒤 검토 화면을 다시 가져온다. 실패하면 이유를 보여 준다
  function wait(jobId: number, kind: JobKind) {
    setWaiting(kind);
    follow(jobId);
  }

  // 작업 상태를 따라가기만 한다 (기다림 표시는 이미 켜져 있을 때)
  function follow(jobId: number) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    waitForAiJob(jobId, controller.signal).then(async (done) => {
      if (!done) return; // 화면을 떠남
      await reload();
      setWaiting(null);
      if (done.status === "failed") setError(aiFailureMessage(done.failureCode));
    });
  }

  // 새로고침했거나 다시 들어왔는데 AI 작업이 돌고 있으면 이어서 기다린다 (S04 에서 막 넘어온 경우 포함)
  useEffect(() => {
    if (initial.runningJobId !== null) follow(initial.runningJobId); // 기다림 표시는 처음부터 켜져 있다
    return () => abortRef.current?.abort();
    // 처음 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 주소 끝이 #사례번호 이면 그 사례를 펼치고 그 위치로 스크롤한다 (S08 사례 근거 → S05 읽기 모드)
  // #… 부분은 서버로 오지 않아서, 화면이 브라우저에 그려진 다음(effect)에만 읽을 수 있다.
  useEffect(() => {
    function openFromHash() {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!initial.episodes.some((ep) => ep.id === id)) return;
      setOpenId(id);
      // 펼친 내용이 그려진 다음 프레임에 스크롤한다
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [initial.episodes]);

  // AI 없이 끝나는 요청: 바뀐 검토 화면을 받아 바꾼다. 성공하면 true
  async function change(request: Promise<ApiResult>, fallback: string) {
    setSaving(true);
    setError(null);
    const { data: review, error: problem, response } = await request;
    setSaving(false);
    if (review) {
      apply(review);
      return true;
    }
    // 그사이 AI 작업이 시작돼 있으면 그 작업을 기다린다
    if (response.status === 409 && isProblem(problem) && typeof problem.runningJobId === "number") wait(problem.runningJobId, "other");
    setError(problemMessage(problem, fallback));
    return false;
  }

  // AI 가 하는 요청: 받아지면(202) 기다리기 시작. 받아지면 true
  async function startJob(request: Promise<Accepted>, kind: JobKind) {
    setSaving(true);
    setError(null);
    const { data: accepted, error: problem, response } = await request;
    setSaving(false);
    if (accepted) {
      wait(accepted.jobId, kind);
      return true;
    }
    if (response.status === 409 && isProblem(problem) && typeof problem.runningJobId === "number") wait(problem.runningJobId, "other");
    setError(problemMessage(problem, "요청을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요."));
    return false;
  }

  const path = (episodeId: number) => ({ params: { path: { projectId, episodeId } } });

  // ── 계산해서 얻는 값 (상태로 따로 들고 있지 않는다)
  const doneCount = episodes.filter((ep) => ep.status !== "review").length;
  const confirmedCount = episodes.filter((ep) => ep.status === "confirmed").length;
  const total = episodes.length;
  const canConfirmProject = total > 0 && doneCount === total && confirmedCount > 0; // 기획서 F2 프로젝트 확정 조건

  // 결정하고 나면 아직 검토 중인 다음 사례를 펼친다 (디자인 review.js 와 같은 흐름)
  // 누른 버튼이 카드와 함께 접혀 사라지므로, 커서를 펼친 사례의 제목(없으면 방금 결정한 사례의 제목)으로 옮긴다 (FE-16)
  async function decide(id: string, numId: number, kind: "confirm" | "exclude") {
    const ok = await change(
      kind === "confirm"
        ? api.POST("/api/projects/{projectId}/episodes/{episodeId}/confirm", path(numId))
        : api.POST("/api/projects/{projectId}/episodes/{episodeId}/exclude", path(numId)),
      kind === "confirm" ? "사례를 확정하지 못했어요. 잠시 뒤 다시 시도해 주세요." : "사례를 제외하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
    );
    if (!ok) return;
    const next = episodes.find((ep) => ep.id !== id && ep.status === "review");
    setOpenId(next ? next.id : null);
    focusAfter(`${next ? next.id : id}-toggle`);
  }

  async function confirmProject() {
    const ok = await change(api.POST("/api/projects/{projectId}/confirm", { params: { path: { projectId } } }), "프로젝트를 확정하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    if (ok) router.push(routes.library);
  }

  const footNote = canConfirmProject
    ? `확정한 사례 ${confirmedCount}개만 지원서 근거로 저장돼요. 제외한 사례는 저장하지 않아요.`
    : doneCount < total
      ? `사례 ${total - doneCount}개가 남았어요. 모든 사례를 확정하거나 제외하면 프로젝트를 확정할 수 있어요.`
      : "확정한 사례가 하나 이상 있어야 프로젝트를 확정할 수 있어요.";

  return (
    <>
      {/* 확정 전에 S04·온보딩 밖으로 나가면 경고하고, 나가기를 고르면 검토 결과를 버린다 (기획서 v1.14 검토 결과 유지 규칙) */}
      <LeaveGuard active={!readOnly} mode="leave-review" discardProjectId={projectId} />
      <div className={styles.head}>
        <div className={styles.headText}>
          <div className={styles.headMeta}>
            {readOnly ? <Badge tone="ok">확정</Badge> : <Badge tone="warn">검토 중</Badge>}
            <span>{data.meta}</span>
          </div>
          <h1 className={styles.title}>{data.title}</h1>
          {readOnly ? (
            <p className={styles.desc}>확정한 사례가 공고 매칭의 근거로 쓰이고 있어요. 고치려면 수정을 눌러 다시 등록해 주세요.</p>
          ) : (
            <p className={styles.desc}>
              AI가 이 프로젝트에서 <strong>사례 {total}개</strong>를 찾았어요. 사례마다 확정하거나 제외해 주세요. 공고와는 사례 단위로
              맞춰 봐요.
            </p>
          )}
        </div>
        {readOnly ? (
          <ReregisterButton projectId={String(projectId)} title={data.title} />
        ) : (
          <div className={styles.progress}>
            <span>
              <strong>
                {doneCount} / {total}
              </strong>{" "}
              결정됨
            </span>
            <div className={styles.bar} style={{ gridTemplateColumns: `repeat(${Math.max(total, 1)}, minmax(0, 1fr))` }} aria-hidden="true">
              {episodes.map((ep) => (
                <span key={ep.id} className={cx(ep.status !== "review" && styles.barDone)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {waiting && (
        <StateCard tone="wait" title={WAIT_TITLE[waiting]}>
          <StateText>보통 15초쯤 걸려요. 끝나면 이 화면이 바뀌어요. 그동안은 사례를 고르거나 고칠 수 없어요.</StateText>
        </StateCard>
      )}
      {error && (
        <Callout tone="bad" icon="alert" role="alert">
          {error}
        </Callout>
      )}

      <div className={styles.split}>
        <RawTextPanel data={data} />

        <section className={styles.main} aria-label="사례 목록">
          {episodes.map((ep, index) => (
            <EpisodeCard
              key={ep.id}
              index={index}
              readOnly={readOnly}
              episode={ep}
              isOpen={openId === ep.id}
              viewingVersion={viewing[ep.id] ?? ep.currentVersion}
              busy={busy}
              onToggle={() => setOpenId((prev) => (prev === ep.id ? null : ep.id))}
              onViewVersion={(v) => setViewing((prev) => ({ ...prev, [ep.id]: v }))}
              onContinueFrom={(v) =>
                change(
                  api.POST("/api/projects/{projectId}/episodes/{episodeId}/restore", { ...path(ep.numId), body: { versionNo: v } }),
                  "이 버전에서 이어서 하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
                )
              }
              onAnswer={(key, answer) =>
                startJob(
                  api.POST("/api/projects/{projectId}/episodes/{episodeId}/clarifications/{key}/answer", {
                    params: { path: { projectId, episodeId: ep.numId, key } },
                    body: { answer },
                  }),
                  "answer",
                )
              }
              onDrop={(key) =>
                change(
                  api.POST("/api/projects/{projectId}/episodes/{episodeId}/clarifications/{key}/drop", {
                    params: { path: { projectId, episodeId: ep.numId, key } },
                  }),
                  "질문을 빼지 못했어요. 잠시 뒤 다시 시도해 주세요.",
                )
              }
              onConfirm={() => decide(ep.id, ep.numId, "confirm")}
              onExclude={() => decide(ep.id, ep.numId, "exclude")}
              onReopen={async () => {
                const ok = await change(
                  api.POST("/api/projects/{projectId}/episodes/{episodeId}/undo", path(ep.numId)),
                  "다시 검토로 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.",
                );
                if (!ok) return;
                setOpenId(ep.id);
                focusAfter(`${ep.id}-toggle`); // "다시 검토하기" 버튼이 사라지므로 그 사례 제목으로 (FE-16)
              }}
              onRevise={(text) =>
                startJob(api.POST("/api/projects/{projectId}/episodes/{episodeId}/revision", { ...path(ep.numId), body: { feedback: text } }), "revise")
              }
              onEdit={(fields: EpisodeFields) =>
                change(
                  api.PUT("/api/projects/{projectId}/episodes/{episodeId}", { ...path(ep.numId), body: toEpisodeRequest(fields) }),
                  "사례를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
                )
              }
            />
          ))}

          {!readOnly &&
            (adding ? (
              <div className={styles.addCard}>
                <h2 className={styles.addCardTitle}>AI가 놓친 사례 직접 추가</h2>
                <EditForm
                  initial={{ title: "", role: "", problem: "", solution: "", result: "" }}
                  busy={busy}
                  submitLabel="사례 추가"
                  onCancel={() => setAdding(false)}
                  onSave={async (fields) => {
                    const ok = await change(
                      api.POST("/api/projects/{projectId}/episodes", { params: { path: { projectId } }, body: toEpisodeRequest(fields) }),
                      "사례를 추가하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
                    );
                    if (ok) setAdding(false);
                  }}
                />
              </div>
            ) : (
              <Button block className={styles.addEpisode} disabled={busy} onClick={() => setAdding(true)}>
                <Icon name="plus" size="sm" />
                AI가 놓친 사례 직접 추가
              </Button>
            ))}
        </section>
      </div>

      {!readOnly && (
        <Card aria-labelledby="feedback-title">
          <div className={styles.bottom}>
            <div className={styles.bottomField}>
              <label id="feedback-title" htmlFor="feedback" className={styles.feedbackLabel}>
                사례를 나눈 방식이 마음에 들지 않나요?
              </label>
              <Textarea
                id="feedback"
                rows={2}
                placeholder="예: 부하 테스트 이야기는 사례 1에 합쳐 줘"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                aria-describedby="feedback-help"
              />
              <p id="feedback-help" className={styles.help}>
                어떻게 나누면 좋을지 적어 주세요. 적은 내용을 반영해 사례를 새로 만들어요. 모든 사례의 결정이 처음으로 돌아가요. 원문에 없는
                사실은 추가되지 않아요.
              </p>
            </div>
            <div className={styles.bottomActions}>
              {/* 다시 나누기는 피드백이 있어야 누를 수 있다 (기획서 v1.12 F2) */}
              <Button
                disabled={busy || !feedback.trim()}
                onClick={async () => {
                  if (await startJob(api.POST("/api/projects/{projectId}/resplit", { params: { path: { projectId } }, body: { feedback: feedback.trim() } }), "resplit"))
                    setFeedback("");
                }}
              >
                <Icon name="refresh" size="sm" />
                다시 나누기
              </Button>
              <Button variant="primary" disabled={busy || !canConfirmProject} onClick={confirmProject}>
                <Icon name="check" size="sm" bold />
                프로젝트 확정
              </Button>
            </div>
            <p className={styles.footNote} aria-live="polite">
              {footNote}
            </p>
          </div>
        </Card>
      )}

      {/* 사례 생성 평가: 프로젝트마다 한 번, 언제든 바꿀 수 있음 (기획서 v1.12, 4.6) */}
      <Card size="sm" aria-label="사례 생성 평가">
        <Rating
          legend="AI가 나눈 사례는 어땠나요?"
          placeholder="예: 사례를 너무 잘게 나눴어요"
          initialScore={rating?.score}
          initialComment={rating?.comment}
          onSubmit={async ({ score, comment }) => {
            const { error: problem } = await api.PUT("/api/projects/{projectId}/rating", {
              params: { path: { projectId } },
              body: { score, comment: comment || null },
            });
            return problem ? problemMessage(problem, "평가를 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.") : null;
          }}
        />
      </Card>
    </>
  );
}

// 직접 편집·직접 추가 → 서버 요청 모양. 정량 성과(metrics)는 보내지 않는다 = 지금 표 유지 (FE 결정 2026-10-26)
function toEpisodeRequest(f: EpisodeFields) {
  return { title: f.title.trim(), role: f.role.trim() || null, problem: f.problem.trim() || null, solution: f.solution.trim() || null, result: f.result.trim() || null };
}
