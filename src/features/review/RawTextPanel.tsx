import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/shared/routes";
import { Card } from "@/shared/ui/Card";
import { currentOf, type ReviewData } from "./review";
import styles from "./Review.module.css";

const TONES = [styles.tone0, styles.tone1, styles.tone2, styles.tone3];
export function toneClass(index: number) {
  return TONES[index % TONES.length];
}

// 원문의 [시작, 끝) 구간마다 어느 사례(번호)의 근거인지 표시한 목록
type Mark = { start: number; end: number; episodeIndex: number };

// 원문 패널: 내가 쓴 원문에서 각 사례의 근거가 된 부분을 사례 색으로 칠한다 (기획서 4.3 source_spans)
// 구간 위치는 "원문 + 확인 질문 답변"(sourceText) 기준이다. 원문 부분은 위치가 같아서 원문 안에 있는 구간만 칠하고,
// 답변은 원문 아래에 "사례 N 확인 질문에 답한 내용"으로 그 사례 색을 칠해 보여 준다. 각 사례의 지금 버전 구간을 쓴다.
// 움직이는 부분이 없어서 서버 컴포넌트다.
export function RawTextPanel({ data }: { data: ReviewData }) {
  const marks: Mark[] = data.episodes
    .flatMap((ep, episodeIndex) => currentOf(ep).sourceSpans.map(([start, end]) => ({ start, end, episodeIndex })))
    .filter((m) => m.end <= data.rawText.length) // 답변 부분의 구간은 아래 답변 목록에서 보여 준다
    .sort((a, b) => a.start - b.start);

  const labeled = new Set<number>(); // "[사례 N]" 라벨은 그 사례가 처음 나오는 문단 앞에 한 번만

  // 문단(빈 줄로 구분)마다 원문 글자 위치를 기억하며 나눈다
  const paragraphs: ReactNode[] = [];
  let offset = 0;
  data.rawText.split("\n\n").forEach((paragraph, pIndex) => {
    const pStart = offset;
    const pEnd = pStart + paragraph.length;
    offset = pEnd + 2; // "\n\n" 두 글자

    const pieces: ReactNode[] = [];
    const labels: ReactNode[] = [];
    let cursor = pStart;
    for (const mark of marks.filter((m) => m.start >= pStart && m.end <= pEnd)) {
      if (!labeled.has(mark.episodeIndex)) {
        labeled.add(mark.episodeIndex);
        labels.push(
          <span key={`label-${mark.episodeIndex}`} className={`${styles.epLabel} ${toneClass(mark.episodeIndex)}`}>
            [사례 {mark.episodeIndex + 1}]
          </span>,
        );
      }
      if (mark.start > cursor) pieces.push(data.rawText.slice(cursor, mark.start));
      pieces.push(
        <mark key={mark.start} className={`${styles.mark} ${toneClass(mark.episodeIndex)}`}>
          {data.rawText.slice(mark.start, mark.end)}
        </mark>,
      );
      cursor = mark.end;
    }
    if (cursor < pEnd) pieces.push(data.rawText.slice(cursor, pEnd));

    paragraphs.push(
      <p key={pIndex}>
        {labels}
        {pieces}
      </p>,
    );
  });

  return (
    <Card tone="sunken" className={styles.side} aria-labelledby="raw-title">
      <div className={styles.rawHead}>
        <h2 id="raw-title" className={styles.rawTitle}>
          내가 쓴 원문
        </h2>
        <Link href={routes.project(String(data.projectId))} className={styles.rawEdit}>
          원문 수정
        </Link>
      </div>
      <p className={styles.legend}>
        표시된 부분이 각 사례에 쓰였어요
        {data.episodes.map((ep, index) => (
          <mark key={ep.id} className={`${styles.mark} ${toneClass(index)}`}>
            사례 {index + 1}
          </mark>
        ))}
      </p>
      <div className={styles.rawBody}>
        {paragraphs}
        {data.supplements.map((s) => {
          const index = data.episodes.findIndex((ep) => ep.numId === s.episodeId);
          return (
            <p key={s.id} className={styles.answers}>
              <strong>{index >= 0 ? `사례 ${index + 1} ` : ""}확인 질문에 답한 내용</strong> ·{" "}
              {index >= 0 ? <mark className={`${styles.mark} ${toneClass(index)}`}>{s.answer}</mark> : s.answer}
            </p>
          );
        })}
      </div>
    </Card>
  );
}
