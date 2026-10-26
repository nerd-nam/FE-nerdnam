import { Card, CardDesc } from "@/shared/ui/Card";
import type { PageKind, PortfolioPage } from "./guide";
import styles from "./PageFlow.module.css";

// S09 포트폴리오 탭의 페이지 흐름 · 작업: FE-14 (원본: design/assets/js/guide.js 의 pagesBlock·thumb)
// 쪽마다 작은 와이어프레임 그림 + "N쪽 · 제목", 제작 도구, 넣을 내용.
// 그림은 쪽의 모양만 보여 주는 장식이다. 실제 차트·도식은 사용자가 도구로 만든다 (D-1 결정: 안내만)
export function PageFlow({ pages: given }: { pages: PortfolioPage[] }) {
  // 서버가 준 순서와 상관없이 order 로 정렬한다. sort 는 원래 배열을 바꾸므로 복사본을 정렬한다
  const pages = [...given].sort((a, b) => a.order - b.order);

  return (
    <Card aria-labelledby="pageflow-title">
      <div className={styles.head}>
        <div className={styles.titleStack}>
          <h2 id="pageflow-title" className={styles.title}>
            페이지 흐름
          </h2>
          <CardDesc>포트폴리오를 {pages.length}쪽으로 구성하는 제안이에요.</CardDesc>
        </div>
        <span className={styles.meta}>도식·차트는 도구로, 커버만 이미지 생성</span>
      </div>

      <ol className={styles.grid}>
        {pages.map((page) => (
          <li key={page.order} className={styles.page}>
            {/* 장식용 그림이라 스크린리더는 건너뛴다. 내용은 아래 글자로 전한다 */}
            <div className={styles.thumb} aria-hidden="true">
              <Wireframe kind={page.kind} />
            </div>
            <div className={styles.text}>
              <div className={styles.pageHead}>
                <strong className={styles.pageTitle}>
                  {page.order}쪽 · {page.title}
                </strong>
                <span className={styles.tool}>{page.tool}</span>
              </div>
              <span className={styles.hint}>{page.hint}</span>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

const KINDS: readonly string[] = ["cover", "text", "diagram", "chart"] satisfies PageKind[];

// 종류별 와이어프레임 4종. 모르는 종류는 텍스트 그림으로 대신한다 (작업목록 FE-14)
function Wireframe({ kind }: { kind: string }) {
  const known = (KINDS.includes(kind) ? kind : "text") as PageKind;

  if (known === "cover") {
    // 커버: 큰 그림 한 장 + 짧은 줄
    return (
      <>
        <div className={styles.image} />
        <div className={styles.line} style={{ width: "55%", background: "var(--line-dashed)" }} />
      </>
    );
  }
  if (known === "diagram") {
    // 도식: 상자 → 강조 상자 → 상자
    return (
      <>
        <div className={styles.wfTitle} />
        <div className={styles.flow}>
          <div className={styles.box} />
          <div className={styles.link} />
          <div className={`${styles.box} ${styles.boxAccent}`} />
          <div className={styles.link} />
          <div className={styles.box} />
        </div>
      </>
    );
  }
  if (known === "chart") {
    // 차트: 전(높음) / 후(낮음) 막대 둘
    return (
      <>
        <div className={styles.wfTitle} />
        <div className={styles.chart}>
          <span style={{ height: "88%", background: "var(--line-dashed)" }} />
          <span style={{ height: "24%", background: "var(--accent)" }} />
        </div>
      </>
    );
  }
  // 텍스트: 제목 + 글 줄 셋
  return (
    <>
      <div className={styles.wfTitle} />
      <div className={styles.line} style={{ marginTop: 6 }} />
      <div className={styles.line} style={{ width: "92%" }} />
      <div className={styles.line} style={{ width: "70%" }} />
    </>
  );
}
