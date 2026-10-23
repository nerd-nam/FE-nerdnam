"use client";

// S09 의 움직이는 부분: 탭 생성 상태(만드는 중·완료·실패)와 "이 탭 다시 만들기", 방향 제시 평가.
// 다시 만들기를 누르면 왼쪽 내용이 "만드는 중" 상자로 바뀌어야 해서, 왼쪽(panel)과 오른쪽을 이 컴포넌트가 함께 그린다.
// 탭 내용(panel)과 근거 목록(sources)은 움직이지 않아서 서버에서 만들어 받아 그 자리에 놓기만 한다.
//
// ④ 에서 붙일 것 (C-02 S09):
// - 만드는 중이면 탭 상태를 주기적으로 조회해(폴링, 공통 3번) 끝나면 내용을 보여 주기
// - 다시 만들기: jd_id·탭 이름·피드백을 보내 그 탭만 새로 만들기 (횟수 제한은 확인할 것 4번)
// - 방향 제시 평가 저장 (공고마다 하나, 다시 보내면 덮어씀 · 기획서 4.6)
import { useState, type ReactNode } from "react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Textarea } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { Rating } from "@/shared/ui/Rating";
import { cx } from "@/shared/ui/cx";
import { StateCard, StateText } from "@/shared/ui/StateCard";
import type { GuideStatus } from "./mock";
import styles from "./Guide.module.css";

type GuideBoardProps = {
  tabLabel: string; // "지원동기" …
  initialStatus: GuideStatus;
  regenHint: string; // 다시 만들기 입력칸 예시
  panel: ReactNode;
  sources: ReactNode;
};

export function GuideBoard({ tabLabel, initialStatus, regenHint, panel, sources }: GuideBoardProps) {
  const [status, setStatus] = useState(initialStatus);
  const [feedback, setFeedback] = useState("");

  return (
    <div className={styles.split}>
      <section className={styles.main} aria-label={`${tabLabel} 작성 방향`}>
        {/* 인쇄할 때는 탭 줄이 빠지므로, 어느 탭인지 제목으로 남긴다 */}
        <h2 className={cx("print-only", styles.printTitle)}>{tabLabel}</h2>
        {status === "done" && panel}
        {status === "generating" && (
          <StateCard tone="wait" title={`${tabLabel} 방향을 만들고 있어요`}>
            <StateText>공고와 확정한 내 경험을 바탕으로 만들고 있어요. 잠시만 기다려 주세요.</StateText>
          </StateCard>
        )}
        {status === "failed" && (
          <StateCard tone="bad" title={`${tabLabel} 방향을 만들지 못했어요`}>
            <StateText>잠시 후 다시 시도해 주세요.</StateText>
            <Button onClick={() => setStatus("generating")}>
              <Icon name="refresh" size="sm" />
              다시 시도
            </Button>
          </StateCard>
        )}
      </section>

      {/* 오른쪽 칸(근거·방향 바꾸기·평가)은 인쇄하지 않는다 */}
      <aside className={cx(styles.side, "print-hide")} aria-label="근거와 방향 바꾸기">
        {sources}

        <Card size="sm" aria-labelledby="regen-title" className={styles.sideCard}>
          <h2 id="regen-title" className={styles.sideTitle}>
            방향 바꾸기
          </h2>
          <label htmlFor="regen-feedback" className={styles.regenLabel}>
            원하는 방향을 알려 주면 이 탭만 다시 만들어요.
          </label>
          <Textarea
            id="regen-feedback"
            rows={3}
            className={styles.regenInput}
            placeholder={regenHint}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
          />
          {/* 방향을 적어야 누를 수 있다 (S05 다시 나누기와 같은 규칙, C-02 S09 에 FE 제안으로 기록). 만드는 중에는 막는다 */}
          <Button disabled={!feedback.trim() || status === "generating"} onClick={() => setStatus("generating")}>
            <Icon name="refresh" size="sm" />이 탭 다시 만들기
          </Button>
        </Card>

        {/* 방향 제시 평가: 탭마다가 아니라 공고마다 한 번, 언제든 바꿀 수 있음 (기획서 4.6·9.1).
            탭마다 주소가 달라 화면이 따로 그려지므로, 지금(서버 저장 전)은 탭을 옮기면 처음 상태로 보일 수 있다.
            ④ 에서 저장된 평가(initialScore·initialComment)를 넘기면 어느 탭에서나 같은 값이 보인다 */}
        <Card size="sm" aria-label="방향 제시 평가" className={styles.sideCard}>
          <Rating legend="이 작성 방향이 도움이 됐나요?" placeholder="예: 지원동기 방향이 너무 일반적이에요" />
        </Card>
      </aside>
    </div>
  );
}
