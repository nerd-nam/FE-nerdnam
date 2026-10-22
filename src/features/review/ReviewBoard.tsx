"use client";

// S05 의 움직이는 부분 전체. 사례 결정·진행률·프로젝트 확정 버튼이 같은 상태를 봐야 해서 상태를 여기 한곳에 모은다.
// 원문 패널(rawPanel)은 움직이지 않아서 서버에서 만들어 받아 그 자리에 끼워 넣기만 한다.
import { useState, type ReactNode } from "react";
import { routes } from "@/shared/routes";
import { Badge } from "@/shared/ui/Badge";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Textarea } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { Rating } from "@/shared/ui/Rating";
import { cx } from "@/shared/ui/cx";
import { EpisodeCard } from "./EpisodeCard";
import { LeaveGuard } from "./LeaveGuard";
import type { Episode, ReviewData } from "./mock";
import styles from "./Review.module.css";

type ReviewBoardProps = {
  data: ReviewData;
  rawPanel: ReactNode; // 서버 컴포넌트(RawTextPanel)를 받아 그대로 놓는다
};

export function ReviewBoard({ data, rawPanel }: ReviewBoardProps) {
  const [episodes, setEpisodes] = useState(data.episodes);
  const [openId, setOpenId] = useState<string | null>(data.episodes[0]?.id ?? null);
  const [viewing, setViewing] = useState<Record<string, number>>(() =>
    Object.fromEntries(data.episodes.map((ep) => [ep.id, ep.currentVersion])),
  );
  const [resolved, setResolved] = useState<string[]>([]); // 처리한 확인 필요 질문 id
  const [feedback, setFeedback] = useState("");

  // ── 계산해서 얻는 값 (상태로 따로 들고 있지 않는다)
  const pendingOf = (ep: Episode) => ep.unverified.filter((q) => !resolved.includes(q.id));
  const doneCount = episodes.filter((ep) => ep.status !== "review").length;
  const confirmedCount = episodes.filter((ep) => ep.status === "confirmed").length;
  const total = episodes.length;
  const canConfirmProject = doneCount === total && confirmedCount > 0; // 기획서 F2 프로젝트 확정 조건

  // ── 상태를 바꾸는 함수들
  function updateEpisode(id: string, change: (ep: Episode) => Episode) {
    setEpisodes((prev) => prev.map((ep) => (ep.id === id ? change(ep) : ep)));
  }

  // 결정하고 나면 아직 검토 중인 다음 사례를 펼친다 (디자인 review.js 와 같은 흐름)
  function openNextReviewing(afterId: string) {
    const next = episodes.find((ep) => ep.id !== afterId && ep.status === "review");
    setOpenId(next ? next.id : null);
  }

  function decide(id: string, status: "confirmed" | "excluded") {
    updateEpisode(id, (ep) => ({ ...ep, status }));
    openNextReviewing(id);
  }

  // "이 버전으로 바꾸기": 고른 버전 내용을 새 최신 버전으로 복사한다 (디자인 예시와 같은 방식, 실제 저장 방식은 BE 결정 · C-02 S05 확인할 것 1번)
  function switchToVersion(id: string, version: number) {
    const ep = episodes.find((item) => item.id === id)!;
    const next = Math.max(...Object.keys(ep.versions).map(Number)) + 1;
    updateEpisode(id, (item) => ({ ...item, currentVersion: next, versions: { ...item.versions, [next]: item.versions[version] } }));
    setViewing((prev) => ({ ...prev, [id]: next }));
  }

  const footNote = canConfirmProject
    ? `확정한 사례 ${confirmedCount}개만 지원서 근거로 저장돼요. 제외한 사례는 저장하지 않아요.`
    : doneCount < total
      ? `사례 ${total - doneCount}개가 남았어요. 모든 사례를 확정하거나 제외하면 프로젝트를 확정할 수 있어요.`
      : "확정한 사례가 하나 이상 있어야 프로젝트를 확정할 수 있어요.";

  return (
    <>
      {/* 확정 전에 S04·온보딩 밖으로 나가면 경고 (기획서 v1.14 검토 결과 유지 규칙) */}
      <LeaveGuard active />
      <div className={styles.head}>
        <div className={styles.headText}>
          <div className={styles.headMeta}>
            <Badge tone="warn">검토 중</Badge>
            <span>{data.meta}</span>
          </div>
          <h1 className={styles.title}>{data.title}</h1>
          <p className={styles.desc}>
            AI가 이 프로젝트에서 <strong>사례 {total}개</strong>를 찾았어요. 사례마다 확정하거나 제외해 주세요. 공고와는 사례 단위로 맞춰
            봐요.
          </p>
        </div>
        <div className={styles.progress}>
          <span>
            <strong>
              {doneCount} / {total}
            </strong>{" "}
            결정됨
          </span>
          <div className={styles.bar} style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden="true">
            {episodes.map((ep) => (
              <span key={ep.id} className={cx(ep.status !== "review" && styles.barDone)} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.split}>
        {rawPanel}

        <section className={styles.main} aria-label="사례 목록">
          {episodes.map((ep, index) => (
            <EpisodeCard
              key={ep.id}
              index={index}
              episode={ep}
              isOpen={openId === ep.id}
              viewingVersion={viewing[ep.id]}
              pending={pendingOf(ep)}
              onToggle={() => setOpenId((prev) => (prev === ep.id ? null : ep.id))}
              onViewVersion={(v) => setViewing((prev) => ({ ...prev, [ep.id]: v }))}
              onUseVersion={(v) => switchToVersion(ep.id, v)}
              // 답변을 원문에 덧붙여 새 버전을 만드는 일(AI)은 ④ 단계에서 붙인다. 지금은 질문만 처리됨으로 바꾼다
              onResolve={(questionId) => setResolved((prev) => [...prev, questionId])}
              onConfirm={() => decide(ep.id, "confirmed")}
              onExclude={() => decide(ep.id, "excluded")}
              onReopen={() => {
                updateEpisode(ep.id, (item) => ({ ...item, status: "review" }));
                setOpenId(ep.id);
              }}
            />
          ))}
          {/* 사례 직접 추가는 ④ 단계에서 붙인다 */}
          <Button block className={styles.addEpisode}>
            <Icon name="plus" size="sm" />
            AI가 놓친 사례 직접 추가
          </Button>
        </section>
      </div>

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
              어떻게 나누면 좋을지 적어 주세요. 적은 내용을 반영해 사례를 새로 만들어요. 원문에 없는 사실은 추가되지 않아요.
            </p>
          </div>
          <div className={styles.bottomActions}>
            {/* 다시 나누기는 피드백이 있어야 누를 수 있다 (기획서 v1.12 F2). 실제 요청은 ④ 단계에서 붙인다 */}
            <Button disabled={!feedback.trim()}>
              <Icon name="refresh" size="sm" />
              다시 나누기
            </Button>
            {canConfirmProject ? (
              // data-allow-leave: 프로젝트 확정은 떠나기 경고를 띄우지 않는다
            <ButtonLink variant="primary" href={routes.library} data-allow-leave>
                <Icon name="check" size="sm" bold />
                프로젝트 확정
              </ButtonLink>
            ) : (
              <Button variant="primary" disabled>
                <Icon name="check" size="sm" bold />
                프로젝트 확정
              </Button>
            )}
          </div>
          <p className={styles.footNote} aria-live="polite">
            {footNote}
          </p>
        </div>
      </Card>

      {/* 사례 생성 평가: 프로젝트마다 한 번, 언제든 바꿀 수 있음 (기획서 v1.12) */}
      <Card size="sm" aria-label="사례 생성 평가">
        <Rating legend="AI가 나눈 사례는 어땠나요?" placeholder="예: 사례를 너무 잘게 나눴어요" />
      </Card>
    </>
  );
}
