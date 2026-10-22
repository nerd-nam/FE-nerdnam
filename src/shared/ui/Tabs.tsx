import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import styles from "./Tabs.module.css";

// ── 버튼 탭: 같은 화면 안에서 보이는 내용만 바꾼다 (예: S04 프로젝트 탭)
// 어떤 탭이 골라졌는지는 이 컴포넌트를 쓰는 쪽이 기억하고(selected), 눌렸을 때 onClick 으로 바꾼다.
export function TabList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="tablist" aria-label={label} className={styles.tabs}>
      {children}
    </div>
  );
}

export function Tab({ selected, className, ...rest }: { selected: boolean } & ComponentProps<"button">) {
  return <button type="button" role="tab" aria-selected={selected} className={cx(styles.tab, className)} {...rest} />;
}

// ── 링크 탭: 탭마다 주소가 따로 있다 (예: S09 /apply/123/guide/intro)
// 주소가 있으니 새로고침해도, 링크를 공유해도 같은 탭이 열린다.
export function TabNav({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label} className={styles.tabs}>
      {children}
    </nav>
  );
}

export function TabLink({ current, className, ...rest }: { current: boolean } & ComponentProps<typeof Link>) {
  return <Link aria-current={current ? "page" : undefined} className={cx(styles.tab, className)} {...rest} />;
}

// ── 세그먼트: 작은 선택지 몇 개 중 하나 (예: S05 사례 버전 v1 / v2)
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" aria-label={label} className={styles.seg}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={styles.segItem}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
