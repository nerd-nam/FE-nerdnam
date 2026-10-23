import { Card } from "@/shared/ui/Card";
import styles from "./Jd.module.css";

// 고정된 작성 가이드 (기획서 F4 "작성 가이드"). 잘못된 예와 바른 예를 함께 보여 준다.
const GUIDE = [
  { title: "한 줄에 요건 하나", hint: "요건이 여러 개 섞여 있으면 줄을 나눠 주세요." },
  { title: "공고 문구를 그대로", hint: "요약하거나 바꾸지 않아야 기술명과 조건이 정확히 잡혀요." },
  { title: "연차는 숫자로", hint: "“3년 이상”처럼 적으면 경력 재직기간으로 계산해요." },
];

export function JdGuide() {
  return (
    <Card size="sm" aria-labelledby="guide-title" className={styles.sideCard}>
      <h2 id="guide-title" className={styles.sideTitle}>
        이렇게 적으면 매칭이 정확해요
      </h2>
      <ol className={styles.guideList}>
        {GUIDE.map((item, index) => (
          <li key={item.title} className={styles.guideItem}>
            <span className={styles.num}>{index + 1}</span>
            <span>
              <strong>{item.title}</strong>
              <br />
              <span className={styles.muted}>{item.hint}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className={styles.example}>
        <strong>예시</strong>
        {/* 색만으로 구분하지 않도록 ✕ ○ 기호를 함께 쓴다 */}
        <span className={styles.bad}>✕ Java, Spring 3년 이상 및 RDBMS 튜닝 경험</span>
        <span className={styles.good}>○ Java/Spring 기반 개발 경력 3년 이상</span>
        <span className={styles.good}>○ RDBMS 설계 및 쿼리 튜닝 경험</span>
      </div>
    </Card>
  );
}
