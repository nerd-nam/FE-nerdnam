import { Tag } from "@/shared/ui/Badge";
import { Callout } from "@/shared/ui/Callout";
import { Card, CardDesc } from "@/shared/ui/Card";
import { CopyButton } from "@/shared/ui/CopyButton";
import type { ImageGuide } from "./guide";
import styles from "./ImagePanel.module.css";

// S09 이미지 프롬프트 탭 · 작업: FE-15 (원본: design/assets/js/guide.js 의 imagePanel)
// 경고 안내 → 프롬프트 카드(복사) → 도구로 만들 시각자료 목록.
// 차트·도식은 서비스가 만들지 않고 도구 안내만 준다 (기획서 F6, D-1 결정: 안내만)
export function ImagePanel({ image }: { image: ImageGuide }) {
  return (
    <>
      <Callout tone="warn" icon="alert">
        이미지 생성은 분위기를 전하는 그림에만 쓰세요. 글자·숫자가 정확해야 하는 도식과 차트는 아래 “도구로 만들 시각자료”를 참고하세요.
      </Callout>

      {image.prompts.map((p, i) => (
        <Card key={i} as="article" aria-labelledby={`prompt-${i}-title`} className={styles.prompt}>
          <div className={styles.head}>
            <div className={styles.titleStack}>
              <h2 id={`prompt-${i}-title`} className={styles.title}>
                {p.title}
              </h2>
              <CardDesc>
                {p.purpose} · 비율 {p.ratio}
              </CardDesc>
            </div>
            {/* 디자인처럼 영문 프롬프트만 복사한다. 제외 요소는 도구마다 넣는 칸이 달라서 따로 둔다 */}
            <CopyButton text={p.prompt} label="프롬프트 복사" />
          </div>
          <div className={styles.block}>
            <span className={styles.codeLabel}>PROMPT</span>
            {/* lang="en": 스크린리더가 영어 발음으로 읽게 한다 */}
            <pre className={styles.code} lang="en">
              {p.prompt}
            </pre>
          </div>
          <div className={styles.block}>
            <span className={styles.codeLabel}>NEGATIVE</span>
            <pre className={`${styles.code} ${styles.codeLight}`} lang="en">
              {p.negative}
            </pre>
          </div>
        </Card>
      ))}

      <Card aria-labelledby="tool-visuals-title" className={styles.tools}>
        <h2 id="tool-visuals-title" className={styles.title}>
          도구로 만들 시각자료
        </h2>
        <ul className={styles.toolList}>
          {image.toolVisuals.map((v, i) => (
            <li key={i} className={styles.toolItem}>
              <span className={styles.toolName}>{v.name}</span>
              <span className={styles.toolWhere}>{v.where}</span>
              <Tag variant="flat">{v.tool}</Tag>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
