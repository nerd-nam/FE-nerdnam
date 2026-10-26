"use client";

// 사례 카드 하나. 사례 데이터·펼침·보고 있는 버전은 ReviewBoard 가 들고 있고, 버튼을 누르면 on… 함수로 알린다.
// 카드 안에서만 쓰는 상태(직접 편집 중인 글, 수정 요청 글, 질문 답변 글)는 카드가 든다.
// - 직접 편집·수정 요청은 카드 안에서 바로 연다 (FE 결정 2026-10-26). 원문 패널을 보면서 고칠 수 있게
// - 직접 편집은 제목·역할·[문제]·[해결]·[결과]만. 정량 성과 표는 그대로 둔다 (서버도 보내지 않으면 유지)
// - busy: AI 작업이 돌거나 서버 답을 기다리는 중이면 모든 버튼을 막는다 (서버가 같은 프로젝트의 변경을 막는다)
import { useState } from "react";
import { Badge, Tag } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Field, Input, Textarea } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { Table } from "@/shared/ui/Table";
import { Segmented } from "@/shared/ui/Tabs";
import { cx } from "@/shared/ui/cx";
import { currentOf, type Episode, type EpisodeVersion, type Question } from "./review";
import { toneClass } from "./RawTextPanel";
import styles from "./Review.module.css";

export type EpisodeFields = Pick<EpisodeVersion, "title" | "role" | "problem" | "solution" | "result">;

type EpisodeCardProps = {
  index: number; // 사례 번호 (0부터)
  readOnly?: boolean; // 읽기 모드: 확정한 프로젝트 보기 (기획서 v1.17). 결정·버전·질문·버튼 줄 없음
  episode: Episode;
  isOpen: boolean;
  viewingVersion: number; // 지금 보고 있는 버전 (현재 버전이 아닐 수 있음)
  busy: boolean;
  onToggle: () => void;
  onViewVersion: (version: number) => void;
  onAnswer: (key: string, answer: string) => void; // 확인 질문 답변 (AI 가 새 버전을 만든다)
  onDrop: (key: string) => void; // "빼고 진행" (AI 없이 새 버전)
  onConfirm: (version: number) => void; // 지금 보고 있는 버전으로 확정 (이전 버전이면 그 버전 내용이 최종이 된다)
  onExclude: () => void;
  onReopen: () => void; // "다시 검토하기"
  onRevise: (feedback: string) => Promise<boolean>; // "이 사례 수정 요청" (AI). 요청이 받아지면 true
  onEdit: (fields: EpisodeFields) => Promise<boolean>; // "직접 편집" 저장. 성공하면 true
};

export function EpisodeCard(props: EpisodeCardProps) {
  const { index, episode, isOpen } = props;
  const current = currentOf(episode);
  const bodyId = `${episode.id}-body`;

  return (
    // id: 주소 끝에 #사례번호 를 붙여 이 카드로 바로 올 수 있게 한다 (S08 사례 근거, 기획서 v1.17)
    <article id={episode.id} className={cx(styles.ep, toneClass(index))}>
      <div className={styles.epHead}>
        {/* 제목 줄을 누르면 펼치고 접는다. aria-expanded 로 스크린리더에 펼침 상태를 알린다 */}
        <button
          type="button"
          id={`${episode.id}-toggle`} // 결정한 뒤 커서를 이 제목으로 옮길 때 쓴다 (FE-16)
          className={styles.epToggle}
          aria-expanded={isOpen}
          aria-controls={bodyId}
          onClick={props.onToggle}
        >
          <span className={styles.epNum}>{index + 1}</span>
          <span className={styles.epTitleWrap}>
            <span className={styles.epTitle}>{current.title}</span>
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
function StatusBadge({ episode, onReopen, readOnly, busy }: EpisodeCardProps) {
  if (readOnly) {
    return (
      <Badge tone="ok">
        <Icon name="check" size="sm" bold />
        확정
      </Badge>
    );
  }
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
        <Button variant="ghost" size="sm" disabled={busy} onClick={onReopen}>
          다시 검토하기
        </Button>
      </span>
    );
  }
  const pending = currentOf(episode).questions.length;
  return pending > 0 ? (
    <Badge tone="warn">
      <Icon name="alert" size="sm" />
      확인 필요 {pending}
    </Badge>
  ) : (
    <Badge tone="info">확정 대기</Badge>
  );
}

function EpisodeBody(props: EpisodeCardProps & { bodyId: string }) {
  const { episode, viewingVersion, bodyId, readOnly, busy } = props;
  const [mode, setMode] = useState<"view" | "edit" | "revise">("view");
  const versionNumbers = Object.keys(episode.versions)
    .map(Number)
    .sort((a, b) => a - b);
  const latest = versionNumbers[versionNumbers.length - 1];
  const shown = episode.versions[viewingVersion] ?? currentOf(episode);
  const previous = episode.versions[viewingVersion - 1];
  const resultChanged = previous && previous.result !== shown.result;
  // 이전 버전을 보고 있는지. 이때는 그 버전으로 확정하거나 제외만 할 수 있다 (FE 결정 2026-10-26).
  // 수정 요청·직접 편집·질문 답변은 최신 버전을 바탕으로 새 버전을 만들어서, 이전 버전을 보는 중에는 숨긴다
  const viewingOlder = viewingVersion !== episode.currentVersion;
  // 확정을 막는 확인 필요 질문: 보고 있는 버전의 질문 (이전 버전으로 확정하면 그 버전의 질문이 살아남는다)
  const pending = shown.questions;
  // 고칠 수 있는 건 검토 중인 사례뿐이다. 확정·제외한 사례는 읽기 전용이고, 고치려면 "다시 검토하기"를 먼저 누른다 (기획서 v1.19)
  const isReviewing = !readOnly && episode.status === "review";

  if (isReviewing && mode === "edit") {
    return (
      <div id={bodyId} className={styles.epBody}>
        <EditForm
          initial={currentOf(episode)}
          busy={busy}
          onCancel={() => setMode("view")}
          onSave={async (fields) => {
            if (await props.onEdit(fields)) setMode("view");
          }}
        />
      </div>
    );
  }

  return (
    <div id={bodyId} className={styles.epBody}>
      <div className={styles.epMeta}>
        <div className={styles.epRole}>
          <span>{shown.role}</span>
          {shown.skills.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </div>
        {isReviewing && versionNumbers.length > 1 && (
          <Segmented
            label="버전"
            options={versionNumbers.map((v) => ({ value: String(v), label: v === latest ? `v${v} · 최신` : `v${v}` }))}
            value={String(viewingVersion)}
            onChange={(v) => props.onViewVersion(Number(v))}
          />
        )}
      </div>

      {/* 이전 버전을 볼 때: 이 버전으로 확정할 수 있다고 알린다 (되돌리기, 기획서 F2. 따로 "바꾸기" 버튼은 두지 않는다 — 누를 때마다 버전이 늘어 헷갈렸다) */}
      {isReviewing && viewingOlder && (
        <div className={styles.olderNote}>
          <span>
            이전 버전(v{viewingVersion})을 보고 있어요. 이대로 확정하면 이 버전 내용으로 확정돼요. 고치려면 최신 버전(v{episode.currentVersion})으로
            돌아가세요.
          </span>
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
        !viewingOlder &&
        pending.map((question) => (
          <QuestionBox
            key={question.key}
            idPrefix={`${episode.id}-${question.key}`}
            question={question}
            busy={busy}
            onAnswer={(answer) => props.onAnswer(question.key, answer)}
            onDrop={() => props.onDrop(question.key)}
          />
        ))}

      {isReviewing && mode === "revise" && (
        <ReviseBox
          id={`${episode.id}-revise`}
          busy={busy}
          onCancel={() => setMode("view")}
          onSend={async (feedback) => {
            if (await props.onRevise(feedback)) setMode("view");
          }}
        />
      )}

      {isReviewing && mode === "view" && (
        <div className={styles.epFoot}>
          <Button variant="ghost" className={styles.dangerText} disabled={busy} onClick={props.onExclude}>
            이 사례 제외
          </Button>
          <div className={styles.row}>
            {!viewingOlder && (
              <>
                <Button disabled={busy} onClick={() => setMode("revise")}>
                  <Icon name="refresh" size="sm" />이 사례 수정 요청
                </Button>
                <Button disabled={busy} onClick={() => setMode("edit")}>
                  직접 편집
                </Button>
              </>
            )}
            <Button
              id={`${episode.id}-confirm`}
              variant="primary"
              disabled={busy || pending.length > 0}
              onClick={() => props.onConfirm(viewingVersion)}
            >
              <Icon name="check" size="sm" bold />
              {viewingOlder ? `v${viewingVersion}로 확정` : "이 사례 확정"}
            </Button>
          </div>
        </div>
      )}
      {isReviewing && pending.length > 0 && (
        <p className={styles.hint}>
          {viewingOlder
            ? "이 버전에는 확인 필요 항목이 남아 있어 확정할 수 없어요. 최신 버전에서 처리해 주세요."
            : "확인 필요 항목을 처리하면 확정할 수 있어요."}
        </p>
      )}
    </div>
  );
}

// 확인 필요 질문 하나. 답을 입력하는 칸은 이 상자만 쓰니 상태도 여기서 들고 있다
function QuestionBox({
  idPrefix,
  question,
  busy,
  onAnswer,
  onDrop,
}: {
  idPrefix: string;
  question: Question;
  busy: boolean;
  onAnswer: (answer: string) => void;
  onDrop: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const inputId = `${idPrefix}-answer`;

  return (
    <section className={styles.question} aria-labelledby={`${idPrefix}-title`}>
      <h4 id={`${idPrefix}-title`} className={styles.questionTitle}>
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
          placeholder={question.example}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
        />
        {/* 답변은 원문에 덧붙여 AI 가 이 사례의 새 버전을 만든다 (질문 하나마다, 기다려야 함) */}
        <Button disabled={busy || !answer.trim()} onClick={() => onAnswer(answer.trim())}>
          답변 추가
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onDrop}>
          빼고 진행
        </Button>
      </div>
    </section>
  );
}

// "이 사례 수정 요청": 어떻게 고칠지 적어 보내면 AI 가 새 버전을 만든다. 원문에 없는 사실은 더하지 않는다 (기획서 F2)
function ReviseBox({ id, busy, onCancel, onSend }: { id: string; busy: boolean; onCancel: () => void; onSend: (feedback: string) => void }) {
  const [feedback, setFeedback] = useState("");
  return (
    <section className={styles.question} aria-labelledby={`${id}-title`}>
      <h4 id={`${id}-title`} className={styles.questionTitle}>
        <Icon name="refresh" />이 사례 수정 요청
      </h4>
      <label htmlFor={`${id}-text`} className="sr-only">
        어떻게 고칠지
      </label>
      <Textarea
        id={`${id}-text`}
        rows={2}
        placeholder="예: [해결]에 캐시를 고른 이유를 더 드러내 줘"
        value={feedback}
        autoFocus
        onChange={(event) => setFeedback(event.target.value)}
      />
      <p className={styles.help}>표현과 정리 방식만 바뀌어요. 원문에 없는 수치·경험은 추가되지 않으니, 사실을 보태려면 직접 편집해 주세요.</p>
      <div className={styles.row}>
        <Button variant="primary" disabled={busy || !feedback.trim()} onClick={() => onSend(feedback.trim())}>
          요청 보내기
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
      </div>
    </section>
  );
}

// 직접 편집·직접 추가 양식. 제목은 꼭 있어야 한다(계약). 정량 성과 표는 고치지 않는다 (FE 결정 2026-10-26)
export function EditForm({
  initial,
  busy,
  submitLabel = "저장",
  onCancel,
  onSave,
}: {
  initial: EpisodeFields;
  busy: boolean;
  submitLabel?: string;
  onCancel: () => void;
  onSave: (fields: EpisodeFields) => void;
}) {
  const [fields, setFields] = useState<EpisodeFields>({
    title: initial.title,
    role: initial.role,
    problem: initial.problem,
    solution: initial.solution,
    result: initial.result,
  });
  const [tried, setTried] = useState(false);
  const titleError = tried && !fields.title.trim() ? "사례 제목을 입력해 주세요." : null;
  const set = (key: keyof EpisodeFields) => (event: { target: { value: string } }) => setFields((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <div className={styles.editForm}>
      <Field id="ep-title" label="사례 제목" required error={titleError}>
        <Input id="ep-title" value={fields.title} invalid={!!titleError} onChange={set("title")} autoFocus />
      </Field>
      <Field id="ep-role" label="역할" hint="(선택)">
        <Input id="ep-role" value={fields.role} placeholder="예: 백엔드 리드 (팀 4명)" onChange={set("role")} />
      </Field>
      <Field id="ep-problem" label="[문제]">
        <Textarea id="ep-problem" rows={3} value={fields.problem} onChange={set("problem")} />
      </Field>
      <Field id="ep-solution" label="[해결]">
        <Textarea id="ep-solution" rows={3} value={fields.solution} onChange={set("solution")} />
      </Field>
      <Field id="ep-result" label="[결과]">
        <Textarea id="ep-result" rows={2} value={fields.result} onChange={set("result")} />
      </Field>
      <p className={styles.help}>직접 쓴 내용은 그대로 새 버전으로 저장돼요. 정량 성과 표는 그대로 남아요.</p>
      <div className={styles.row}>
        <Button
          variant="primary"
          disabled={busy}
          onClick={() => {
            setTried(true);
            if (fields.title.trim()) onSave(fields);
          }}
        >
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}
