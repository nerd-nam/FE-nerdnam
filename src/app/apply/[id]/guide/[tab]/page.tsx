import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Page, PageHead } from "@/shared/layout/Page";
import { GUIDE_TABS, isGuideTab, routes } from "@/shared/routes";
import { APPLY_STEPS } from "@/shared/steps";
import { Callout } from "@/shared/ui/Callout";
import { Stepper } from "@/shared/ui/Stepper";
import { TabLink, TabNav } from "@/shared/ui/Tabs";

export const metadata: Metadata = { title: "작성 방향" };

// S09 작성 방향 (주소: /apply/[id]/guide/[tab]) · 채우는 작업: FE-13~15
// 예: /apply/17/guide/intro → id="17", tab="intro"
//
// params(주소 속 값)는 요청이 들어와야 알 수 있다. 그래서 값을 읽는 부분만 <Suspense> 로 감싸고,
// 나머지(단계 표시, 제목)는 미리 만들어 두었다가 바로 보여 준다. (Next.js 16 cacheComponents 규칙)
export default function GuidePage({ params }: PageProps<"/apply/[id]/guide/[tab]">) {
  return (
    <Page tight>
      <Stepper label="지원 준비 단계" steps={APPLY_STEPS} current={2} />
      <PageHead title="이 공고에 맞춘 작성 방향" meta="[회사명] · [포지션]" />
      <Suspense>
        {params.then(({ id, tab }) => (
          <GuideTabs id={id} tab={tab} />
        ))}
      </Suspense>
    </Page>
  );
}

function GuideTabs({ id, tab }: { id: string; tab: string }) {
  // 모르는 탭 이름이면 (예: /guide/abc) 404 화면을 보여 준다.
  if (!isGuideTab(tab)) notFound();

  const current = GUIDE_TABS.find((item) => item.tab === tab)!;

  return (
    <>
      <TabNav label="산출물">
        {GUIDE_TABS.map((item) => (
          <TabLink key={item.tab} href={routes.guide(id, item.tab)} current={item.tab === tab}>
            {item.label}
          </TabLink>
        ))}
      </TabNav>
      <Callout tone="sunken" icon="info">
        {current.label} 탭은 FE-13 에서 만들 예정이에요.
      </Callout>
    </>
  );
}
