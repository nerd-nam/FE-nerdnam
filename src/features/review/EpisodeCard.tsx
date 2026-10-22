"use client";

// 사례 카드 하나. 상태(펼침·결정·버전)는 ReviewBoard 가 들고 있고, 이 카드는 받은 값으로 그리기만 한다.
// 버튼을 누르면 on… 함수로 ReviewBoard 에 알린다.
import { useState } from "react";
import { Badge, Tag } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { Table } from "@/shared/ui/Table";
import { Segmented } from "@/shared/ui/Tabs";
import { cx } from "@/shared/ui/cx";
import type { Episode, Unverified } from "./mock";
import { toneClass } from "./RawTextPanel";
import styles from "./Review.module.css";

type EpisodeCardProps = {
  index: number; // 사례 번호 (0부터)
  episode: Episode;
  isOpen: boolean;
  viewingVersion: number; // 지금 보고 있는 버전 (현재 버전이 아닐 수 있음)
  pending: Unverified[]; // 아직 처리하지 않은 확인 필요
  onToggle: () => void;
  onViewVersion: (version: number) => void;
  onUseVersion: (version: number) => void; // "이 버전으로 바꾸기"
  onResolve: (questionId: string, answer: string | null) => void; // 답변 추가(answer) · 빼고 진행(null)
  onConfirm: () => void;
  onExclude: () => void;
  onReopen: () => void; // "다시 검토하기"
};

export function EpisodeCard(props: EpisodeCardProps) {
  const { index, episode, isOpen } = props;
  const current = episode.versions[episode.currentVersion];
  const bodyId = `${episode.id}-body`;

  return (
    <article className={cx(styles.ep, toneClass(index))}>
      <div className={styles.epHead}>
        {/* 제목 줄을 누르면 펼치고 접는다. aria-expanded 로 스크린리더에 펼침 상태를 알린다 */}
        <button type="button" className={styles.epToggle} aria-expanded={isOpen} aria-controls={bodyId} onClick={props.onToggle}>
          <span className={styles.epNum}>{index + 1}</span>
          <span className={styles.epTitleWrap}>
            <span className={styles.epTitle}>{episode.title}</span>
            {!isOpen && <span className={styles.epSummary}>{current.result}</span>}
          </span>
        </button>
        <StatusBadge {...props} />
      </div>

      {isOpen && <EpisodeBody {...props} bodyId={bodyId} />}
    </article>
  );
}

// 제목 오른쪽 상태 표시 + "다시 검토하기"
function StatusBadge({ episode, pending, onReopen }: EpisodeCardProps) {
  if (episode.status === "confirmed" || episode.status === "excluded") {
    return (
      <span className={styles.epStatus}>
        {episode.status === "confirmed" ? (
          <Badge tone="ok">
            <Icon name="check" size="sm" bold />
            확정
          </Badge>
        ) : (
          <Badge tone="muted">제외 · 저장 안 함</Badge>
        )}
        <Button variant="ghost" size="sm" onClick={onReopen}>
          다시 검토하기
        </Button>
      </span>
    );
  }
  return pending.length > 0 ? (
    <Badge tone="warn">
      <Icon name="alert" size="sm" />
      확인 필요 {pending.length}
    </Badge>
  ) : (
    <Badge tone="info">확정 대기</Badge>
  );
}

function EpisodeBody({ episode, viewingVersion, pending, bodyId, ...on }: EpisodeCardProps & { bodyId: string }) {
  const versionNumbers = Object.keys(episode.versions)
    .map(Number)
    .sort((a, b) => a - b);
  const latest = versionNumbers[versionNumbers.length - 1];
  const shown = episode.versions[viewingVersion];
  const previous = episode.versions[viewingVersion - 1];
  const resultChanged = previous && previous.result !== shown.result;
  const isReviewing = episode.status === "review";

  return (
    <div id={bodyId} className={styles.epBody}>
      <div className={styles.epMeta}>
        <div className={styles.epRole}>
          <span>{episode.role}</span>
          {episode.skills.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </div>
        {versionNumbers.length > 1 && (
          <Segmented
            label="버전"
            options={versionNumbers.map((v) => ({ value: String(v), label: v === latest ? `v${v} · 최신` : `v${v}` }))}
            value={String(viewingVersion)}
            onChange={(v) => on.onViewVersion(Number(v))}
          />
        )}
      </div>

      {/* 이전 버전을 볼 때만 "이 버전으로 바꾸기" (기획서 v1.11 F2 되돌리기) */}
      {viewingVersion !== episode.currentVersion && (
        <div className={styles.olderNote}>
          <span>
            이전 버전(v{viewingVersion})을 보고 있어요. 지금 쓰는 내용은 최신 버전(v{episode.currentVersion})이에요.
          </span>
          <Button size="sm" onClick={() => on.onUseVersion(viewingVersion)}>
            이 버전으로 바꾸기
          </Button>
        </div>
      )}

      <div className={styles.block}>
        <h3 className={styles.epLabelText}>[문제]</h3>
        <p className={styles.epText}>{shown.problem}</p>
      </div>
      <div className={styles.block}>
        <h3 className={styles.epLabelText}>[해결]</h3>
        <p className={styles.epText}>{shown.solution}</p>
      </div>
      <div className={styles.block}>
        <h3 className={styles.epLabelText}>
          [결과]
          {resultChanged && <Badge tone="info">v{viewingVersion - 1}에서 바뀜</Badge>}
        </h3>
        <p className={styles.epText}>{shown.result}</p>
        {shown.metrics.length > 0 && (
          <Table variant="boxed">
            <caption className="sr-only">정량 성과</caption>
            <thead>
              <tr>
                <th scope="col">지표</th>
                <th scope="col">개선 전</th>
                <th scope="col">개선 후</th>
                <th scope="col">출처</th>
              </tr>
            </thead>
            <tbody>
              {shown.metrics.map((m) => (
                <tr key={m.name}>
                  <td>
                    <strong>{m.name}</strong>
                  </td>
                  <td>{m.before}</td>
                  <td>
                    <strong>{m.after}</strong>
                  </td>
                  <td>{m.source}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {isReviewing &&
        pending.map((question) => <QuestionBox key={question.id} question={question} onResolve={(answer) => on.onResolve(question.id, answer)} />)}

      <div className={styles.epFoot}>
        {isReviewing ? (
          <Button variant="ghost" className={styles.dangerText} onClick={on.onExclude}>
            이 사례 제외
          </Button>
        ) : (
          <span />
        )}
        <div className={styles.row}>
          {/* 수정 요청·직접 편집은 서버(AI) 연결이 필요해 ④ 단계에서 붙인다 */}
          <Button>
            <Icon name="refresh" size="sm" />이 사례 수정 요청
          </Button>
          <Button>직접 편집</Button>
          {isReviewing && (
            <Button variant="primary" disabled={pending.length > 0} onClick={on.onConfirm}>
              <Icon name="check" size="sm" bold />이 사례 확정
            </Button>
          )}
        </div>
      </div>
      {isReviewing && pending.length > 0 && <p className={styles.hint}>확인 필요 항목을 처리하면 확정할 수 있어요.</p>}
    </div>
  );
}

// 확인 필요 질문 하나. 답을 입력하는 칸은 이 상자만 쓰니 상태도 여기서 들고 있다
function QuestionBox({ question, onResolve }: { question: Unverified; onResolve: (answer: string | null) => void }) {
  const [answer, setAnswer] = useState("");
  const inputId = `${question.id}-answer`;

  return (
    <section className={styles.question} aria-labelledby={`${question.id}-title`}>
      <h4 id={`${question.id}-title`} className={styles.questionTitle}>
        <Icon name="alert" />
        확인 필요
      </h4>
      <p className={styles.questionText}>{question.question}</p>
      <div className={styles.row}>
        <label htmlFor={inputId} className="sr-only">
          답변
        </label>
        <Input
          id={inputId}
          className={styles.grow}
          placeholder={question.placeholder}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
        />
        <Button disabled={!answer.trim()} onClick={() => onResolve(answer.trim())}>
          답변 추가
        </Button>
        <Button variant="ghost" onClick={() => onResolve(null)}>
          빼고 진행
        </Button>
      </div>
    </section>
  );
}
