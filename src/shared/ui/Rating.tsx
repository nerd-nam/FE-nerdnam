"use client";

// 만족도 평가: 5점 별점 + 한 줄 의견(선택). S05 사례 생성 평가, S09 방향 제시 평가에서 같이 쓴다 (기획서 3장 공통·4.6·9.1)
// 별은 라디오 버튼이라 키보드(Tab → 화살표)로도 고를 수 있다. 보낸 뒤에도 바꿀 수 있고 마지막 값만 남는다.
import { useId, useState } from "react";
import { Button } from "./Button";
import { Input } from "./Field";
import { Icon } from "./Icon";
import { cx } from "./cx";
import styles from "./Rating.module.css";

const SCORE_LABELS = ["매우 아쉬워요", "아쉬워요", "보통이에요", "도움됐어요", "아주 도움됐어요"];

type RatingProps = {
  legend: string; // 질문. 예: "AI가 나눈 사례는 어땠나요?"
  placeholder: string; // 한 줄 의견 예시
  initialScore?: number; // 이미 남긴 평가가 있으면
  initialComment?: string;
  // 보내기를 눌렀을 때. 저장(API)은 ④ 단계에서 붙인다
  onSubmit?: (value: { score: number; comment: string }) => void;
};

export function Rating({ legend, placeholder, initialScore = 0, initialComment = "", onSubmit }: RatingProps) {
  const name = useId(); // 라디오 버튼 묶음 이름 (화면에 평가가 둘 있어도 안 겹치게)
  const [score, setScore] = useState(initialScore);
  const [comment, setComment] = useState(initialComment);
  const [sent, setSent] = useState(initialScore > 0); // 지금 화면의 값을 보냈는지 (값을 바꾸면 false)
  const [everSent, setEverSent] = useState(initialScore > 0); // 한 번이라도 보냈는지 (버튼 글자용)

  return (
    <fieldset className={styles.rating}>
      <legend className={styles.legend}>{legend}</legend>

      <div className={cx(styles.row, styles.starRow)}>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={cx(styles.star, n <= score && styles.on)}>
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={n}
                checked={score === n}
                onChange={() => {
                  setScore(n);
                  setSent(false);
                }}
              />
              <Icon name="star" size="lg" />
              <span className="sr-only">
                {n}점 · {SCORE_LABELS[n - 1]}
              </span>
            </label>
          ))}
        </div>
        <span className={styles.label} aria-live="polite">
          {score ? `${score}점 · ${SCORE_LABELS[score - 1]}` : "별을 눌러 평가해 주세요"}
        </span>
      </div>

      <div className={styles.row}>
        <label htmlFor={`${name}-comment`} className="sr-only">
          한 줄 의견 (선택)
        </label>
        <Input
          id={`${name}-comment`}
          className={styles.comment}
          placeholder={placeholder}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setSent(false);
          }}
        />
        <Button
          size="sm"
          disabled={score === 0}
          onClick={() => {
            onSubmit?.({ score, comment: comment.trim() });
            setSent(true);
            setEverSent(true);
          }}
        >
          {everSent ? "다시 보내기" : "보내기"}
        </Button>
      </div>

      {sent && (
        <p className={styles.done} role="status">
          평가를 보냈어요. 언제든 바꿀 수 있어요.
        </p>
      )}
    </fieldset>
  );
}
