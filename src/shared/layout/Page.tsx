import type { ReactNode } from "react";
import { cx } from "@/shared/ui/cx";
import styles from "./Layout.module.css";

type PageProps = {
  // 본문 최대 폭: wide 1200px / mid 1120px / narrow 1040px
  width?: "wide" | "mid" | "narrow";
  tight?: boolean; // 묶음 사이 간격을 조금 좁게
  grow?: boolean; // 화면 높이가 남으면 본문이 채움 (바닥글을 아래로 밀 때)
  children: ReactNode;
};

// 화면 본문 틀. 화면마다 <main> 은 하나만 있어야 해서 이 컴포넌트로 통일한다.
export function Page({ width = "wide", tight, grow, children }: PageProps) {
  return (
    <main className={cx(styles.page, width !== "wide" && styles[width], tight && styles.tight, grow && styles.grow)}>
      {children}
    </main>
  );
}

type PageHeadProps = {
  title: ReactNode;
  desc?: ReactNode;
  meta?: ReactNode; // 제목 위 작은 글씨. 예: "OO페이 · 백엔드 개발자"
  actions?: ReactNode; // 제목 오른쪽 버튼들
};

// 화면 제목 + 설명. 화면의 큰 제목(<h1>)은 여기서만 만든다.
export function PageHead({ title, desc, meta, actions }: PageHeadProps) {
  const text = (
    <div className={styles.pageHeadText}>
      {meta && <p className={styles.pageMeta}>{meta}</p>}
      <h1 className={styles.pageTitle}>{title}</h1>
      {desc && <p className={styles.pageDesc}>{desc}</p>}
    </div>
  );

  if (!actions) return text;

  return (
    <div className={styles.pageHead}>
      {text}
      <div>{actions}</div>
    </div>
  );
}
