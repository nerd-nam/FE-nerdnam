"use client";

// 월 입력칸: 직접 입력 + 달력 버튼으로 고르기. S03 재직기간, S04 프로젝트 기간에서 쓴다.
// 브라우저 기본 월 선택 칸(type="month")은 맥 Safari 가 지원하지 않아 아무 글자나 들어가서 직접 만들었다.
// - 직접 입력: 숫자만 치면 "2023.03" 모양으로 점을 넣는다 (규칙은 shared/period.ts)
// - 고르기: 달력 버튼 → 연도 ‹ › 와 1~12월. 이번 달보다 뒤는 고를 수 없다. Esc·바깥 클릭·Tab 으로 밖에 나가면 닫는다
// 값은 "YYYY-MM"(다 적지 않았으면 적은 글자 그대로)으로 onChange 에 알린다. 값은 쓰는 쪽이 들고 있다.
import { useEffect, useRef, useState } from "react";
import { formatTyped, isMonth, padMonth, thisMonth, toText, toValue } from "@/shared/period";
import { cx } from "./cx";
import { Icon } from "./Icon";
import styles from "./MonthField.module.css";

type MonthFieldProps = {
  id: string;
  label: string; // 스크린리더용 이름. 예: "시작 월" (화면에는 묶음 라벨 "재직기간"이 보인다)
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void; // 칸을 떠났을 때 (오류를 보여 주기 시작하는 데 쓴다)
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string; // 오류 메시지 id
  // 고르기 상자를 칸의 어느 쪽 끝에 맞출지. 오른쪽에 있는 칸(종료 월)은 "end" 로 해야 화면 밖으로 넘치지 않는다
  align?: "start" | "end";
};

export function MonthField({ id, label, value, onChange, onBlur, disabled, invalid, describedBy, align = "start" }: MonthFieldProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const max = thisMonth();
  // 달력에서 보고 있는 연도. 처음에는 입력한 연도, 없으면 올해
  const [year, setYear] = useState(() => Number((isMonth(value) ? value : max).slice(0, 4)));

  // 열려 있을 때 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function toggle() {
    if (!open) setYear(Number((isMonth(value) ? value : max).slice(0, 4)));
    setOpen((prev) => !prev);
  }

  function pick(month: number) {
    onChange(`${year}-${String(month).padStart(2, "0")}`);
    setOpen(false);
    inputRef.current?.focus(); // 고른 뒤 커서를 입력칸으로 돌려준다
  }

  const pickerId = `${id}-picker`;
  const maxYear = Number(max.slice(0, 4));

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      // 키보드(Tab)로 칸·달력 밖으로 나가면 달력을 닫는다. 안 닫으면 아래 칸들을 가린 채 남는다 (FE-16 점검)
      onBlur={(event) => {
        if (!wrapRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <input
        ref={inputRef}
        id={id}
        aria-label={label}
        className={cx(styles.input, invalid && styles.invalid)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        inputMode="numeric" // 휴대폰에서 숫자 자판을 띄운다
        placeholder="YYYY.MM"
        autoComplete="off"
        value={toText(value)}
        disabled={disabled}
        onChange={(event) => onChange(toValue(formatTyped(event.target.value)))}
        onBlur={(event) => {
          // 월이 한 자리면("2023.3") 칸을 떠날 때 두 자리로 채운다
          const padded = padMonth(event.target.value);
          if (padded !== value) onChange(padded);
          onBlur?.();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      />
      <button
        type="button"
        className={styles.toggle}
        aria-label={`${label} 고르기`}
        aria-expanded={open}
        aria-controls={pickerId}
        disabled={disabled}
        // 누를 때 입력칸에서 커서가 빠지며 달력이 닫혔다가 다시 열리지 않게 (아래 달력 상자와 같은 이유)
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggle}
      >
        <Icon name="calendar" size="sm" />
      </button>

      {open && (
        <div
          id={pickerId}
          role="dialog"
          aria-label={`${label} 고르기`}
          className={cx(styles.picker, align === "end" && styles.alignEnd)}
          // 마우스로 누를 때 커서를 옮기지 않는다. Safari·맥 Firefox 는 버튼을 눌러도 커서를 버튼으로 옮기지 않아서,
          // 누르는 순간 "밖으로 나감"(위 onBlur)으로 보고 달력을 닫아 버려 달을 골라도 값이 안 들어갔다. 클릭(pick)은 그대로 된다
          onMouseDown={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              inputRef.current?.focus();
            }
          }}
        >
          <div className={styles.yearRow}>
            <button type="button" className={styles.yearBtn} aria-label="이전 해" onClick={() => setYear((y) => y - 1)}>
              <Icon name="chevronLeft" size="sm" />
            </button>
            <span className={styles.year} aria-live="polite">
              {year}년
            </span>
            <button
              type="button"
              className={styles.yearBtn}
              aria-label="다음 해"
              disabled={year >= maxYear}
              onClick={() => setYear((y) => y + 1)}
            >
              <Icon name="chevronRight" size="sm" />
            </button>
          </div>
          <div className={styles.months}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const key = `${year}-${String(month).padStart(2, "0")}`;
              return (
                <button
                  key={month}
                  type="button"
                  className={styles.month}
                  aria-pressed={value === key}
                  disabled={key > max} // 미래 월은 고를 수 없다
                  // 처음 열 때 고른 달(없으면 첫 달)에 커서를 둔다
                  autoFocus={value === key || (!isMonth(value) && month === 1)}
                  onClick={() => pick(month)}
                >
                  {month}월
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
