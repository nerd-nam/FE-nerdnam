// S09 작성 방향: 서버 응답(C-03 Guide)을 화면에서 쓰기 좋은 모양으로 바꾼다.
// content 는 AI 계약(C-04 /guide 응답 content)의 탭별 모양을 그대로 받는다(C-02 S09 확인할 것 6). 계약상 타입이 없는 JSON 이라
// 칸이 빠지거나 모양이 달라도 화면이 깨지지 않게, 하나씩 확인하며 꺼낸다(없으면 빈 값).
import { toEvidence, type RequirementType } from "@/features/report/report";
import type { components } from "@/shared/api/schema";
import type { Evidence } from "@/shared/evidence";
import type { GuideTab } from "@/shared/routes";

type GuideView = components["schemas"]["Guide"];
type MatchView = components["schemas"]["MatchView"];
// 탭 상태: 아직 만든 적 없음(null) / 만드는 중 / 완료 / 실패
export type GuideStatus = components["schemas"]["TabStatus"]["status"];

// 작업이 돌고 있으면 만드는 중으로 본다. 서버는 작업 안에서 행을 만들어서, 막 시작한 탭은 status 가 아직 null 일 수 있고
// 다시 만들기 중이면 지난 결과(completed)가 최신일 수 있다
export function effectiveStatus(t: { status: GuideStatus; runningJobId: number | null }): GuideStatus {
  return t.runningJobId !== null ? "generating" : t.status;
}

// 문단 구성의 한 줄: 제목, 설명, 근거
export type OutlineItem = { title: string; desc: string; sources: Evidence[] };

// 네 탭(지원동기·자기소개·포트폴리오·경력기술서)이 같이 가진 내용 (기획서 F5 "산출물 4종 방향성")
export type GuideDoc = {
  message: string; // 핵심 메시지
  outlineTitle: string; // "문단 구성" · "포트폴리오 구성" · "작성 순서" (웹이 정함, C-02 S09 AI 응답 이름 표)
  outline: OutlineItem[];
  keywords: string[]; // 강조할 키워드
  avoid: string[]; // 피해야 할 것
};

// 자기소개: 요건 커버리지 (요건마다 어느 문단이 다루는지). 요건 문구·필수/우대는 리포트에서 붙인다
export type CoverageRow = { text: string; type: RequirementType; covered: boolean; where: string };
// 경력기술서: 공고 용어로 바꿔 쓰기. requirement = "필수 · 요건 문구"
export type RewriteRow = { from: string; to: string; requirement: string };

// 포트폴리오 페이지 흐름 (C-02 S09 포트폴리오 탭, 작업목록 AI-09)
// kind 는 4종만 온다(cover·text·diagram·chart, 서버가 정리). 그래도 모르는 값이 오면 웹은 텍스트 그림으로 대신한다 (FE-14).
// 시각자료 미리보기(visual)는 없다 — 차트·도식은 사용자가 도구로 만든다 (D-1 결정: 안내만)
export type PageKind = "cover" | "text" | "diagram" | "chart";
export type PortfolioPage = { order: number; title: string; hint: string; tool: string; kind: string };

// 이미지 프롬프트 탭 (C-02 S09, 기획서 F6·7.3, 작업목록 AI-10)
export type ImagePrompt = { title: string; purpose: string; ratio: string; prompt: string; negative: string };
export type ToolVisual = { name: string; where: string; tool: string }; // 도구로 만들 시각자료: 이름, 위치, 도구
export type ImageGuide = { prompts: ImagePrompt[]; toolVisuals: ToolVisual[] };

// "이 방향에 쓰인 근거" 목록
export type GuideSource = { evidence: Evidence; requirementCount: number };

export type GuideContent =
  | { tab: "motive"; doc: GuideDoc }
  | { tab: "intro"; doc: GuideDoc; coverage: CoverageRow[] }
  | { tab: "portfolio"; doc: GuideDoc; pages: PortfolioPage[] }
  | { tab: "career"; doc: GuideDoc; rewrites: RewriteRow[] }
  | { tab: "image"; image: ImageGuide };

// 탭마다 웹이 정하는 글자 (디자인 guide-data.js)
const OUTLINE_TITLE: Record<Exclude<GuideTab, "image">, string> = {
  motive: "문단 구성",
  intro: "문단 구성",
  portfolio: "포트폴리오 구성",
  career: "작성 순서",
};

// "방향 바꾸기" 입력칸 예시
export const REGEN_HINT: Record<GuideTab, string> = {
  motive: "예: 회사의 기술 블로그 이야기로 시작하고 싶어요",
  intro: "예: 협업 경험을 더 앞에 두고 싶어요",
  portfolio: "예: 정산 배치 프로젝트를 먼저 보여 주고 싶어요",
  career: "예: 이전 회사 경력도 공고에 맞춰 바꿔 줘",
  image: "예: 커버를 더 밝은 톤으로 바꿔 줘",
};

// 제작 도구 이름은 kind 로 웹이 붙인다 (C-02 S09 AI 응답 이름 표)
const TOOL: Record<string, string> = { cover: "이미지 생성", text: "텍스트", diagram: "다이어그램", chart: "차트" };

// ---- 모양을 모르는 JSON 에서 꺼내기
type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Json) : {});
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const text = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
const texts = (v: unknown): string[] => list(v).map(text).filter(Boolean);

// 근거 목록: 탭 응답의 citations 에 있는 청크만 쓴다. 없는 청크 id 는 서버가 지운 것이라 무시한다 (C-02 S09 확인할 것 6)
export function toSources(guide: GuideView): GuideSource[] {
  return guide.citations.map((c) => ({ evidence: toEvidence(c), requirementCount: c.requirementCount }));
}

// requirements: 리포트의 요건(자기소개 커버리지·경력기술서 바꿔 쓰기에서 requirement_id 로 요건 문구를 찾는다)
export function toGuideContent(tab: GuideTab, guide: GuideView, requirements: MatchView[]): GuideContent {
  const content = obj(guide.content);
  const byChunk = new Map(guide.citations.map((c) => [c.chunkId, toEvidence(c)]));
  const byRequirement = new Map(requirements.map((m) => [m.requirementId, m]));
  const sources = (v: unknown) => list(v).flatMap((id) => byChunk.get(num(id) ?? -1) ?? []);

  if (tab === "image") {
    return {
      tab,
      image: {
        prompts: list(content.prompts).map((p) => {
          const page = num(obj(p).page);
          return {
            title: text(obj(p).title),
            // 위치는 page 로 웹이 붙인다 ("포트폴리오 커버 · 1쪽")
            purpose: `${text(obj(p).purpose)}${page !== null ? ` · ${page}쪽` : ""}`,
            ratio: text(obj(p).ratio),
            prompt: text(obj(p).prompt),
            negative: text(obj(p).negative),
          };
        }),
        toolVisuals: list(content.tool_visuals).map((v) => {
          const page = num(obj(v).page);
          return {
            name: text(obj(v).name),
            where: page !== null ? `포트폴리오 ${page}쪽` : "포트폴리오",
            tool: TOOL[text(obj(v).kind)] ?? "도구",
          };
        }),
      },
    };
  }

  const doc: GuideDoc = {
    message: text(content.message),
    outlineTitle: OUTLINE_TITLE[tab],
    outline: list(content.outline).map((item) => ({
      title: text(obj(item).title),
      desc: text(obj(item).detail),
      sources: sources(obj(item).sources),
    })),
    keywords: texts(content.keywords),
    avoid: texts(content.avoid),
  };

  if (tab === "intro") {
    return {
      tab,
      doc,
      // 리포트에 없는 요건(지워짐 등)은 문구를 알 수 없어 뺀다
      coverage: list(content.coverage).flatMap((row) => {
        const m = byRequirement.get(num(obj(row).requirement_id) ?? -1);
        if (!m) return [];
        return [{ text: m.text, type: m.type, covered: obj(row).covered === true, where: text(obj(row).where) }];
      }),
    };
  }
  if (tab === "portfolio") {
    return {
      tab,
      doc,
      pages: list(content.pages).map((p, i) => {
        const kind = text(obj(p).kind);
        return { order: num(obj(p).order) ?? i + 1, title: text(obj(p).title), hint: text(obj(p).hint), tool: TOOL[kind] ?? TOOL.text, kind };
      }),
    };
  }
  if (tab === "career") {
    return {
      tab,
      doc,
      rewrites: list(content.rewrites).map((r) => {
        const m = byRequirement.get(num(obj(r).requirement_id) ?? -1);
        return {
          from: text(obj(r).before),
          to: text(obj(r).after),
          requirement: m ? `${m.type === "required" ? "필수" : "우대"} · ${m.text}` : "",
        };
      }),
    };
  }
  return { tab, doc };
}
