"use client";

// 기간(시작 월 – 종료 월) 묶음. S03 재직기간, S04 프로젝트 기간이 같이 쓴다.
// - ongoingLabel 을 주면 "재직 중" 같은 체크가 생기고, 체크하면 종료 월이 null(진행 중)이 된다
// - 달력에서는 시작 월보다 앞의 종료 월, 종료 월보다 뒤의 시작 월을 고를 수 없다. 직접 입력한 순서 오류는 오류 문장으로 알린다
// - 오류는 칸을 떠난 뒤(blur), 또는 showErrors 가 켜지면(저장을 누른 뒤) 보여 준다
// - names 를 주면 화면에 안 보이는 칸(hidden)으로 값을 함께 넣는다. 양식(form)으로 값을 모으는 S04 에서 쓴다
import { useState } from "react";
import { PERIOD_MESSAGES, monthError, orderError } from "@/shared/period";
import { Checkbox } from "./Field";
import { MonthField } from "./MonthField";
import styles from "./PeriodField.module.css";

export type Period = { start: string; end: string | null };

type PeriodFieldProps = {
  id: string; // 칸 id 앞부분. 예: "career" → career-start, career-end
  label: string; // 묶음 이름. 예: "재직기간"
  value: Period;
  onChange: (value: Period) => void;
  required?: boolean; // 시작(과 진행 중이 아니면 종료)을 꼭 적어야 하는지
  ongoingLabel?: string; // 예: "재직 중"
  showErrors?: boolean;
  names?: { start: string; end: string };
};

// 기간의 오류 목록 (화면 위 요약이나 저장 막기에 쓴다)
export function periodErrors({ start, end }: Period, required: boolean) {
  const startError = monthError(start) ?? (required && !start ? PERIOD_MESSAGES.startRequired : null);
  const endError = end === null ? null : (monthError(end) ?? (required && !end ? PERIOD_MESSAGES.endRequired : null));
  return { start: startError, end: endError, order: startError || endError ? null : orderError(start, end) };
}

export function PeriodField({ id, label, value, onChange, required = false, ongoingLabel, showErrors = false, names }: PeriodFieldProps) {
  const [touched, setTouched] = useState({ start: false, end: false });
  const errors = periodErrors(value, required);
  const show = {
    start: (showErrors || touched.start) && errors.start,
    end: (showErrors || touched.end) && errors.end,
    order: (showErrors || (touched.start && touched.end)) && errors.order,
  };
  const messages = [show.start, show.end, show.order].filter(Boolean) as string[];
  const errorId = `${id}-period-error`;

  return (
    <div role="group" aria-labelledby={`${id}-period-label`}>
      <span id={`${id}-period-label`} className={styles.label}>
        {label}
        {required && (
          <span className={styles.req} aria-label="필수">
            *
          </span>
        )}
      </span>
      <div className={styles.range}>
        <MonthField
          id={`${id}-start`}
          label={`${label} 시작 월`}
          value={value.start}
          max={value.end ?? undefined} // 달력에서 종료 월보다 뒤는 고를 수 없다 (FE 결정 2026-10-26)
          onChange={(start) => onChange({ ...value, start })}
          onBlur={() => setTouched((t) => ({ ...t, start: true }))}
          invalid={!!(show.start || show.order)}
          describedBy={messages.length ? errorId : undefined}
        />
        <span aria-hidden="true" className={styles.dash}>
          –
        </span>
        <MonthField
          id={`${id}-end`}
          label={`${label} 종료 월`}
          value={value.end ?? ""}
          min={value.start} // 달력에서 시작 월보다 앞은 고를 수 없다
          onChange={(end) => onChange({ ...value, end })}
          onBlur={() => setTouched((t) => ({ ...t, end: true }))}
          disabled={value.end === null} // 진행 중이면 종료 월을 막는다
          align="end"
          invalid={!!(show.end || show.order)}
          describedBy={messages.length ? errorId : undefined}
        />
      </div>
      {ongoingLabel && (
        <Checkbox
          className={styles.ongoing}
          checked={value.end === null}
          onChange={(event) => onChange({ ...value, end: event.target.checked ? null : "" })}
        >
          {ongoingLabel}
        </Checkbox>
      )}
      {messages.length > 0 && (
        <p id={errorId} className={styles.err}>
          {messages.join(" ")}
        </p>
      )}
      {names && (
        <>
          <input type="hidden" name={names.start} value={value.start} />
          <input type="hidden" name={names.end} value={value.end ?? ""} />
        </>
      )}
    </div>
  );
}
