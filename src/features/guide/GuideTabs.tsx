"use client";

// S09 탭 줄 + 다섯 탭 함께 만들기 (FE 결정 2026-10-27, 사용자 결정 — C-02 S09 확인할 것 1 변경)
// - 화면을 열면 아직 만든 적 없는 탭을 모두 바로 만들기 시작한다(피드백 없이). 서버는 탭마다 따로 잠가서 동시에 돈다(ADR-0002 lock_scope = 탭)
//   지금 보고 있는 탭은 GuideBoard 가 만들고 기다린다 — 여기서는 나머지 탭만
// - 탭 이름 옆에 상태를 보여 준다: 만드는 중(도는 아이콘)·완료(체크)·실패(경고). 다른 탭을 보고 있어도 끝나면 바뀐다
//   다른 탭은 작업 번호(runningJobId)로 2.5초마다, 번호가 없으면 탭 상태 목록(GET /guides)을 5초마다 묻는다 (GuideBoard 와 같은 간격)
//   지금 탭의 상태는 GuideBoard 가 알려 준다(announceGuideStatus)
import { useEffect, useRef, useState } from "react";
import { waitForAiJob } from "@/shared/api/aiJob";
import { api } from "@/shared/api/client";
import { isProblem } from "@/shared/api/problem";
import type { components } from "@/shared/api/schema";
import { GUIDE_TABS, routes, type GuideTab } from "@/shared/routes";
import { cx } from "@/shared/ui/cx";
import { Icon } from "@/shared/ui/Icon";
import { TabLink, TabNav } from "@/shared/ui/Tabs";
import { effectiveStatus, type GuideStatus } from "./guide";
import styles from "./Guide.module.css";

type TabStatus = components["schemas"]["TabStatus"];

const GUIDE_POLL_MS = 5000;
const EVENT = "guide-status";

// GuideBoard(지금 탭)가 상태가 바뀔 때 부른다
export function announceGuideStatus(tab: GuideTab, status: GuideStatus) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { tab, status } }));
}

const LABEL: Record<NonNullable<GuideStatus>, string> = { generating: "만드는 중", completed: "완료", failed: "실패" };

type GuideTabsProps = {
  postingId: number;
  current: GuideTab;
  initial: TabStatus[]; // 화면을 열 때 받은 GET /guides 의 tabs
};

export function GuideTabs({ postingId, current, initial: given }: GuideTabsProps) {
  // 목록에 없는 탭은 아직 만든 적 없는 탭으로 본다
  const initial = GUIDE_TABS.map(
    ({ tab }) => given.find((t) => t.tab === tab) ?? { tab, status: null, generationNo: null, runningJobId: null },
  );
  const [statuses, setStatuses] = useState(() => new Map(initial.map((t) => [t.tab, effectiveStatus(t)])));
  // 화면 읽기 프로그램에 다른 탭이 끝났다고 알린다
  const [news, setNews] = useState("");
  const startedRef = useRef(false); // 개발 모드에서 effect 가 두 번 돌아도 만들기를 한 번만 시작한다
  const signalRef = useRef<AbortSignal | null>(null); // 지금 살아 있는 effect 의 신호 (화면을 떠나면 끊긴다)
  const jobsRef = useRef<Map<GuideTab, number> | null>(null); // 탭 → 기다리는 작업 번호

  useEffect(() => {
    const controller = new AbortController();
    signalRef.current = controller.signal;
    const label = (tab: GuideTab) => GUIDE_TABS.find((item) => item.tab === tab)!.label;

    function set(tab: GuideTab, status: GuideStatus) {
      setStatuses((prev) => new Map(prev).set(tab, status));
      if (tab !== current && status === "completed") setNews(`${label(tab)} 방향을 다 만들었어요.`);
      if (tab !== current && status === "failed") setNews(`${label(tab)} 방향을 만들지 못했어요.`);
    }

    function follow(tab: GuideTab, jobId: number) {
      jobs.set(tab, jobId);
      // 요청이 늦게 돌아와도 지금 살아 있는 신호로 기다린다 (개발 모드의 두 번째 effect)
      waitForAiJob(jobId, signalRef.current!).then((done) => {
        if (!done) return; // 화면을 떠남 (다시 보이면 jobs 로 이어서 기다린다)
        jobs.delete(tab);
        set(tab, done.status === "completed" ? "completed" : "failed");
      });
    }

    // 작업 번호 없이 만드는 중인 탭들: 상태 목록을 몇 초마다 다시 묻는다
    async function poll(tabs: GuideTab[]) {
      const waiting = new Set(tabs);
      while (waiting.size > 0 && !controller.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, GUIDE_POLL_MS));
        if (controller.signal.aborted) return;
        const { data } = await api
          .GET("/api/job-postings/{postingId}/guides", { params: { path: { postingId } }, signal: controller.signal })
          .catch(() => ({ data: undefined }));
        for (const t of data?.tabs ?? []) {
          if (!waiting.has(t.tab)) continue;
          if (t.runningJobId !== null) follow(t.tab, t.runningJobId);
          else if (t.status !== "generating") set(t.tab, t.status);
          else continue;
          waiting.delete(t.tab);
        }
      }
    }

    async function start(tab: GuideTab) {
      // 보내지도 못하면(네트워크·CSRF 토큰) 실패로 표시한다 — 안 그러면 "만드는 중"에 멈춘다
      const { data, error } = await api
        .POST("/api/job-postings/{postingId}/guides/{tab}", { params: { path: { postingId, tab } }, body: { feedback: null } })
        .catch(() => ({ data: undefined, error: undefined }));
      if (data) return follow(tab, data.jobId);
      // 이미 만들고 있으면(409 + runningJobId) 그 작업을 기다린다
      if (isProblem(error) && error.runningJobId != null) return follow(tab, error.runningJobId);
      set(tab, "failed");
    }

    // 기다리는 작업 번호. Next.js 는 떠난 탭 화면을 숨겨 두었다가(effect 는 정리) 돌아오면 다시 보여 주므로,
    // 처음 받은 값(initial)이 아니라 여기 남은 번호로 이어서 기다린다
    const jobs = (jobsRef.current ??= new Map(initial.flatMap((t) => (t.runningJobId !== null ? [[t.tab, t.runningJobId] as const] : []))));
    const others = initial.filter((t) => t.tab !== current);
    for (const [tab, jobId] of jobs) {
      if (tab !== current) follow(tab, jobId);
    }
    poll(others.filter((t) => t.runningJobId === null && t.status === "generating" && !jobs.has(t.tab)).map((t) => t.tab));
    if (!startedRef.current) {
      startedRef.current = true;
      const toStart = others.filter((t) => effectiveStatus(t) === null).map((t) => t.tab);
      for (const tab of toStart) set(tab, "generating");
      toStart.forEach(start);
    }

    function onAnnounce(event: Event) {
      const { tab, status } = (event as CustomEvent<{ tab: GuideTab; status: GuideStatus }>).detail;
      setStatuses((prev) => new Map(prev).set(tab, status));
    }
    window.addEventListener(EVENT, onAnnounce);
    return () => {
      controller.abort();
      window.removeEventListener(EVENT, onAnnounce);
    };
    // 처음 한 번만 (서버가 준 탭 상태가 바뀌면 page.tsx 의 key 가 바뀌어 새로 만들어진다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TabNav label="산출물">
        {GUIDE_TABS.map((item) => {
          const status = statuses.get(item.tab) ?? null;
          return (
            <TabLink key={item.tab} href={routes.guide(String(postingId), item.tab)} current={item.tab === current}>
              {item.label}
              {status && (
                <>
                  <span className={cx(styles.tabMark, styles[`tabMark_${status}`])}>
                    <Icon name={status === "generating" ? "refresh" : status === "completed" ? "check" : "alert"} size="sm" />
                  </span>
                  <span className="sr-only">({LABEL[status]})</span>
                </>
              )}
            </TabLink>
          );
        })}
      </TabNav>
      <p className="sr-only" aria-live="polite">
        {news}
      </p>
    </>
  );
}
