import Link from "next/link";
import { Fragment } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";
import styles from "./Stepper.module.css";

export type Step = {
  label: string;
  // 완료한 단계에 href 가 있으면 "수정" 링크가 되어 그 단계로 돌아갈 수 있다 (기획서 F1 "이전 단계로 돌아가 수정·추가")
  href?: string;
};

type StepperProps = {
  label: string; // 스크린리더용 이름. 예: "온보딩 단계"
  steps: Step[];
  current: number; // 지금 단계의 순번 (0부터)
};

// 단계 표시: ✓기술스택 — ✓경력 — ③프로젝트 — ④검토·확정
export function Stepper({ label, steps, current }: StepperProps) {
  return (
    // print-hide: 인쇄할 때 단계 표시는 뺀다
    <nav aria-label={label} className="print-hide">
      <ol className={styles.stepper}>
        {steps.map((step, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const line = index > 0 && <li aria-hidden="true" className={cx(styles.line, index <= current && styles.lineDone)} />;

          // 완료 + 링크 있음: 눌러서 그 단계로 돌아간다
          if (isDone && step.href) {
            return (
              <Fragment key={step.label}>
                {line}
                <li>
                  <Link href={step.href} className={cx(styles.step, styles.done, styles.link)} title={`${step.label} 수정하기`}>
                    <StepDot index={index} done />
                    <span className={styles.text}>{step.label}</span>
                    <span className={styles.edit}>수정</span>
                  </Link>
                </li>
              </Fragment>
            );
          }

          return (
            <Fragment key={step.label}>
              {line}
              <li className={cx(styles.step, isDone && styles.done, isCurrent && styles.current)} aria-current={isCurrent ? "step" : undefined}>
                <StepDot index={index} done={isDone} />
                {step.label}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

function StepDot({ index, done }: { index: number; done: boolean }) {
  return <span className={styles.dot}>{done ? <Icon name="check" size="sm" bold /> : index + 1}</span>;
}
