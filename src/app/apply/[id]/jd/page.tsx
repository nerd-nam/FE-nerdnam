import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JdForm } from "@/features/jd/JdForm";
import { JdGuide } from "@/features/jd/JdGuide";
import { EMPTY_JD, MOCK_ANALYZED_JD_ID, findJd } from "@/features/jd/mock";
import styles from "@/features/jd/Jd.module.css";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_JD_ID } from "@/shared/routes";
import { APPLY_STEPS } from "@/shared/steps";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "공고 입력" };

// S07 JD 입력 · 작업: FE-11 (지금: ① 모양 · ② 나누기 · ③ 움직임(화면 안에서만), ④ 저장 전)
// 주소: /apply/new/jd (새 공고) 또는 /apply/j_201/jd (저장된 공고 수정)
// 데이터는 임시 데이터(features/jd/mock.ts)를 쓴다.
export default function JdPage({ params }: PageProps<"/apply/[id]/jd">) {
  return (
    <Page>
      <Stepper label="지원 준비 단계" steps={APPLY_STEPS} current={0} />
      <PageHead
        title="지원할 공고를 입력해 주세요"
        desc={
          <>
            공고를 보면서 항목에 맞게 옮겨 적어 주세요. <span className={styles.bad}>*</span> 표시는 꼭 필요한 항목이에요.
          </>
        }
      />
      {/* 주소의 공고 번호가 필요한 부분만 Suspense 로 감싼다 (Next.js 16 cacheComponents 규칙) */}
      <Suspense>
        {params.then(({ id }) => (
          <JdContent id={id} />
        ))}
      </Suspense>
    </Page>
  );
}

function JdContent({ id }: { id: string }) {
  const isNew = id === NEW_JD_ID;
  const jd = isNew ? EMPTY_JD : findJd(id);

  // 없는 번호면 404
  if (!jd) notFound();

  // key: 다른 공고로 옮겨 가면 양식을 새로 만든다 (S04 ProjectForm 과 같은 안전장치)
  return <JdForm key={id} initial={jd} reportJdId={isNew ? MOCK_ANALYZED_JD_ID : id} guide={<JdGuide />} />;
}
