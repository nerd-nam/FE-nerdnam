import { Callout } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import styles from "./Project.module.css";

// 고정된 작성 가이드. 이 화면은 AI 를 부르지 않는다 (기획서 F1).
// 빠진 내용은 다음 단계(S05)에서 AI 가 "확인 필요" 질문으로 받는다.
const GUIDE = [
  { q: "어떤 문제가 있었나요?", hint: "무엇이 불편했고, 얼마나 심각했는지" },
  { q: "무엇을, 왜 그렇게 했나요?", hint: "선택한 방법과 그 이유, 다른 대안" },
  { q: "내 역할은 무엇이었나요?", hint: "팀 규모와 내가 맡은 부분" },
  { q: "결과는 어떻게 바뀌었나요?", hint: "전후 숫자가 있으면 가장 좋아요. 대략이어도 괜찮아요." },
];

export function WritingGuide() {
  return (
    <aside className={styles.side} aria-label="작성 가이드">
      <Card size="sm" aria-labelledby="guide-title">
        <h2 id="guide-title" className={styles.guideTitle}>
          이런 내용이 있으면 좋아요
        </h2>
        <ol className={styles.guideList}>
          {GUIDE.map((item, index) => (
            <li key={item.q} className={styles.guideItem}>
              <span className={styles.num}>{index + 1}</span>
              <span>
                <strong>{item.q}</strong>
                <br />
                <span className={styles.muted}>{item.hint}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Callout tone="sunken" icon="info">
        다 채우지 못해도 괜찮아요. 다음 단계에서 AI가 [문제]-[해결]-[결과]로 정리하면서 빠진 내용을 질문해요. 원문은 그대로 보관돼요.
      </Callout>
    </aside>
  );
}
