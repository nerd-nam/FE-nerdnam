import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GuideBoard } from "@/features/guide/GuideBoard";
import { GuidePanel } from "@/features/guide/GuidePanel";
import { findGuide } from "@/features/guide/mock";
import { SourcesCard } from "@/features/guide/SourcesCard";
import styles from "@/features/guide/Guide.module.css";
import { Page, PageHead } from "@/shared/layout/Page";
import { GUIDE_TABS, isGuideTab, routes } from "@/shared/routes";
import { APPLY_STEPS } from "@/shared/steps";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Stepper } from "@/shared/ui/Stepper";
import { TabLink, TabNav } from "@/shared/ui/Tabs";

export const metadata: Metadata = { title: "작성 방향" };

// S09 작성 방향 (주소: /apply/[id]/guide/[tab]) · 작업: FE-13 (지금: ① 모양 · ② 나누기 · ③ 움직임(화면 안에서만), ④ 조회 전)
// 예: /apply/j_201/guide/intro → id="j_201", tab="intro". 탭마다 주소가 있어 새로고침·공유해도 같은 탭이 열린다.
// 데이터는 임시 데이터(features/guide/mock.ts): j_201 모두 완료, j_204 지원동기 만드는 중·자기소개 실패.
// 포트폴리오 페이지 흐름은 FE-14(features/guide/PageFlow), 이미지 프롬프트 탭은 FE-15(features/guide/ImagePanel).
// PDF 내보내기는 D-6(브라우저 인쇄 / 서버 생성) 결정 전이라 버튼 자리만 둔다.
//
// params(주소 속 값)는 요청이 들어와야 알 수 있다. 그래서 값을 읽는 부분만 <Suspense> 로 감싸고,
// 나머지(단계 표시)는 미리 만들어 두었다가 바로 보여 준다. (Next.js 16 cacheComponents 규칙)
export default function GuidePage({ params }: PageProps<"/apply/[id]/guide/[tab]">) {
  return (
    <Page tight>
      <Stepper label="지원 준비 단계" steps={APPLY_STEPS} current={2} />
      <Suspense>
        {params.then(({ id, tab }) => (
          <GuideContent id={id} tab={tab} />
        ))}
      </Suspense>
    </Page>
  );
}

function GuideContent({ id, tab }: { id: string; tab: string }) {
  // 모르는 탭 이름(예: /guide/abc)이나 없는 공고면 404 화면을 보여 준다.
  if (!isGuideTab(tab)) notFound();
  const guide = findGuide(id);
  if (!guide) notFound();

  const current = GUIDE_TABS.find((item) => item.tab === tab)!;
  const regenHint = tab === "image" ? guide.image.regenHint : guide.docs[tab].regenHint;

  return (
    <>
      <PageHead
        meta={`${guide.company} · ${guide.position}`}
        title="이 공고에 맞춘 작성 방향"
        actions={
          <div className={styles.headActions}>
            <ButtonLink href={routes.report(id)}>적합도 리포트</ButtonLink>
            {/* PDF 내보내기: 방식(D-6)이 정해지면 FE-15 에서 붙인다. 그때까지 눌리지 않는 자리만 */}
            <Button disabled>PDF로 내보내기</Button>
          </div>
        }
      />

      <TabNav label="산출물">
        {GUIDE_TABS.map((item) => (
          <TabLink key={item.tab} href={routes.guide(id, item.tab)} current={item.tab === tab}>
            {item.label}
          </TabLink>
        ))}
      </TabNav>

      {/* key: 탭이 바뀌면 상태(만드는 중 등)와 입력한 방향을 새로 시작한다 */}
      <GuideBoard
        key={tab}
        tabLabel={current.label}
        initialStatus={guide.status[tab]}
        regenHint={regenHint}
        panel={<GuidePanel tab={tab} guide={guide} />}
        sources={<SourcesCard sources={guide.sources} />}
      />
    </>
  );
}
