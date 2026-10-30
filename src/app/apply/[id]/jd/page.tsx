import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EMPTY_JD, toJdDraft } from "@/features/jd/jd";
import { JdForm } from "@/features/jd/JdForm";
import { JdGuide } from "@/features/jd/JdGuide";
import styles from "@/features/jd/Jd.module.css";
import { data, serverApi } from "@/shared/api/server";
import { dataKey } from "@/shared/dataKey";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_JD_ID, routes } from "@/shared/routes";
import { APPLY_STEPS } from "@/shared/steps";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "공고 입력" };

// S07 JD 입력 · 작업: FE-11 (① 모양 · ② 나누기 · ③ 움직임 · ④ 서버 연결)
// 주소: /apply/new/jd (새 공고) 또는 /apply/201/jd (저장된 공고 수정)
// 저장된 공고는 서버에서 가져온다(GET /api/job-postings/{id}). 저장·분석 시작은 브라우저에서 보낸다 (JdForm).
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

async function JdContent({ id }: { id: string }) {
  let jd = EMPTY_JD;
  if (id !== NEW_JD_ID) {
    const postingId = Number(id);
    if (!Number.isInteger(postingId)) notFound();
    const api = await serverApi(routes.jd(id));
    jd = toJdDraft(data(await api.GET("/api/job-postings/{postingId}", { params: { path: { postingId } } }))); // 없는 번호·남의 공고면 404
  }

  // key: 다른 공고로 옮겨 가거나, 다시 왔을 때 서버의 공고가 바뀌었으면 양식을 새로 만든다 (S04 와 같은 안전장치, shared/dataKey)
  return <JdForm key={dataKey([id, jd])} initial={jd} guide={<JdGuide />} />;
}
