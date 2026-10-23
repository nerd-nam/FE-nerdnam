"use client";

// S08 분석 중 / 분석 실패 상자 (작업목록 FE-12). 디자인이 없어 공용 상태 카드(StateCard)로 만들었다.
// ④ 에서 붙일 것: 분석 중이면 작업 상태를 주기적으로 조회해(폴링, C-02 공통 3번) 끝나면 리포트를 보여 주고,
// "다시 시도"는 분석을 다시 시작한다 (C-02 S08 저장·변경). 지금은 "다시 시도"를 누르면 분석 중 상자로 바뀌기만 한다.
import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { StateCard, StateText } from "@/shared/ui/StateCard";
import type { AnalysisStatus } from "./mock";

export function AnalysisState({ initial }: { initial: Exclude<AnalysisStatus, "done"> }) {
  const [status, setStatus] = useState(initial);

  if (status === "failed") {
    return (
      <StateCard tone="bad" title="분석을 마치지 못했어요">
        {/* 기획서 F4 표 마지막 줄과 8장(GPU 서버 꺼짐)의 "잠시 후 다시 시도" 안내를 따랐다 */}
        <StateText>입력한 공고는 그대로 남아 있으니 잠시 후 다시 시도해 주세요.</StateText>
        <Button onClick={() => setStatus("analyzing")}>
          <Icon name="refresh" size="sm" />
          다시 시도
        </Button>
      </StateCard>
    );
  }

  return (
    <StateCard tone="wait" title="공고와 내 경험을 맞춰 보고 있어요">
      <StateText>요건마다 내 경험에서 근거를 찾아 판정하고 있어요. 잠시만 기다려 주세요.</StateText>
    </StateCard>
  );
}
