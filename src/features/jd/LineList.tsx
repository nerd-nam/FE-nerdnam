"use client";

// S07 목록 칸 하나 (필수사항 / 우대사항 / 주요 업무). 한 줄에 하나씩 적는다 (기획서 F4 "입력 편의").
// - Enter: 지금 줄 아래에 새 줄을 만들고 그 줄로 옮긴다
// - 여러 줄 붙여넣기: 줄마다 나눠 넣고 앞의 목록 기호를 지운다. AI 를 쓰지 않는 규칙 처리다
// - 줄 목록(lines)은 부모(JdForm)가 들고 있다. 여기서는 바뀐 목록을 onChange 로 알려 주기만 한다
import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { Count } from "@/shared/ui/Badge";
import { Button, IconButton } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { MESSAGES, filledLines, lineError, splitPasted, type Line } from "./lines";
import styles from "./Jd.module.css";

export type LineListProps = {
  name: string; // 칸 구별용 영문 이름. 제목 id 에 쓴다 (예: "required")
  title: string;
  required?: boolean;
  where: string; // 제목 오른쪽 작은 글씨: 이 칸이 어디에 쓰이는지
  desc: string;
  placeholder: string;
  addLabel: string;
  lines: Line[];
  onChange: (lines: Line[]) => void;
  newLine: (text?: string) => Line; // 새 줄 만들기 (번호는 부모가 겹치지 않게 매긴다)
  showErrors: boolean; // "적합도 분석하기"를 한 번 누른 뒤부터 오류를 보여 준다
};

export function LineList({ name, title, required, where, desc, placeholder, addLabel, lines, onChange, newLine, showErrors }: LineListProps) {
  // 줄을 새로 만든 뒤 그 줄로 커서를 옮기기 위해, 줄 id → 입력칸을 기억해 둔다
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const focusNext = useRef<string | null>(null);

  // 화면이 다시 그려진 다음에(새 줄의 입력칸이 생긴 다음에) 커서를 옮긴다
  useEffect(() => {
    if (!focusNext.current) return;
    inputs.current.get(focusNext.current)?.focus();
    focusNext.current = null;
  });

  function edit(id: string, text: string) {
    onChange(lines.map((line) => (line.id === id ? { ...line, text } : line)));
  }

  function insertAfter(id: string, added: Line[], replaceCurrent = false) {
    const index = lines.findIndex((line) => line.id === id);
    const next = [...lines];
    next.splice(replaceCurrent ? index : index + 1, replaceCurrent ? 1 : 0, ...added);
    focusNext.current = added[added.length - 1].id;
    onChange(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>, line: Line) {
    // 한글을 조합하는 중의 Enter 는 글자를 마무리하는 키라서 건드리지 않는다
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    insertAfter(line.id, [newLine()]);
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>, line: Line) {
    const text = event.clipboardData.getData("text");
    if (!text.includes("\n")) return; // 한 줄짜리는 브라우저가 평소처럼 붙여 넣게 둔다
    event.preventDefault();
    const pasted = splitPasted(text);
    if (pasted.length === 0) return; // 빈 줄만 붙여넣은 경우
    // 지금 줄이 비어 있으면 그 자리를 채우고, 글이 있으면 그 아래에 넣는다
    insertAfter(line.id, pasted.map(newLine), line.text.trim() === "");
  }

  function remove(id: string) {
    // 마지막 한 줄을 지우면 빈 줄 하나를 남긴다 (입력칸이 하나도 없으면 다시 적을 곳이 없어서)
    // 지운 뒤에는 그 자리에 온 줄(마지막 줄이었으면 윗줄)로 커서를 옮긴다. 삭제 버튼이 사라져 포커스가 맨 위로 튀지 않게 (FE-16)
    if (lines.length === 1) {
      const line = newLine();
      focusNext.current = line.id;
      onChange([line]);
      return;
    }
    const index = lines.findIndex((line) => line.id === id);
    const next = lines.filter((line) => line.id !== id);
    focusNext.current = (next[index] ?? next[index - 1]).id;
    onChange(next);
  }

  function add() {
    const line = newLine();
    focusNext.current = line.id;
    onChange([...lines, line]);
  }

  const count = filledLines(lines).length;
  const emptyError = showErrors && required && count === 0;
  const titleId = `${name}-title`;
  const emptyErrorId = `${name}-empty-error`;

  return (
    <Card aria-labelledby={titleId} className={styles.listCard}>
      <div className={styles.between}>
        <h2 id={titleId} className={styles.cardTitle}>
          {title}
          {required ? (
            <span className={styles.req} aria-label="필수">
              *
            </span>
          ) : (
            <span className={styles.optional}>(선택)</span>
          )}
          <Count>{count}</Count>
        </h2>
        <span className={styles.meta}>{where}</span>
      </div>
      <p className={styles.cardDesc}>{desc}</p>

      <ol className={styles.lines}>
        {lines.map((line, index) => {
          const error = showErrors ? lineError(lines, line) : null;
          const errorId = `${line.id}-error`;
          // 필수사항이 비었으면 첫 줄을 빨갛게 표시해서, 커서가 그 줄로 가고 스크린리더가 메시지를 읽게 한다
          const emptyHere = emptyError && index === 0;
          return (
            <li key={line.id}>
              <div className={styles.lineRow}>
                <span aria-hidden="true" className={styles.lineNum}>
                  {index + 1}
                </span>
                <Input
                  ref={(el) => {
                    if (el) inputs.current.set(line.id, el);
                    else inputs.current.delete(line.id);
                  }}
                  value={line.text}
                  placeholder={placeholder}
                  aria-label={`${title} ${index + 1}`}
                  invalid={!!error || emptyHere}
                  aria-describedby={error ? errorId : emptyHere ? emptyErrorId : undefined}
                  onChange={(event) => edit(line.id, event.target.value)}
                  onKeyDown={(event) => onKeyDown(event, line)}
                  onPaste={(event) => onPaste(event, line)}
                />
                <IconButton label={`${title} ${index + 1} 삭제`} onClick={() => remove(line.id)}>
                  <Icon name="x" />
                </IconButton>
              </div>
              {error && (
                <p id={errorId} className={styles.lineErr}>
                  {error}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {emptyError && (
        <p id={emptyErrorId} className={styles.err}>
          {MESSAGES.requiredEmpty}
        </p>
      )}

      <div className={styles.between}>
        <Button variant="text" onClick={add}>
          <Icon name="plus" size="sm" />
          {addLabel}
        </Button>
        <span className={styles.tip}>Enter로 다음 줄 추가 · 여러 줄을 붙여넣으면 줄마다 나눠 넣어요</span>
      </div>
    </Card>
  );
}
