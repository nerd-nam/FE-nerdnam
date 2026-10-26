import type { Metadata } from "next";
import { Suspense } from "react";
import { PostingList } from "@/features/apply/PostingList";
import { toPostingSummary } from "@/features/apply/posting";
import { data, serverApi } from "@/shared/api/server";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_JD_ID, routes } from "@/shared/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";

export const metadata: Metadata = { title: "지원 준비" };

// S10 공고 목록 (주소: /apply) · 작업: FE-18 (① 모양 · ② 나누기 · ③ 움직임 · ④ 조회·삭제 연결)
// 머리글 "지원 준비" 메뉴가 여기로 온다. 디자인: design/apply.html (기획서 v1.31). 지원 상태·공고 간 비교는 P2.
// 목록은 서버에서 가져온다(GET /api/job-postings). 삭제는 버튼을 눌렀을 때 브라우저에서 보낸다(PostingList).
// 공고가 없으면 "아직 공고가 없어요" 안내가 보인다.
export default function ApplyListPage() {
  return (
    <Page>
      <PageHead
        title="지원 준비"
        desc="지원할 공고마다 적합도 리포트와 작성 방향을 받아요. 최근에 고친 공고부터 보여요."
        actions={
          <ButtonLink variant="primary" href={routes.jd(NEW_JD_ID)}>
            <Icon name="plus" />새 공고
          </ButtonLink>
        }
      />
      {/* 로그인 쿠키를 읽어 서버에 묻는 부분만 Suspense 로 감싼다. 제목과 "새 공고" 버튼은 먼저 보인다 */}
      <Suspense>
        <Postings />
      </Suspense>
    </Page>
  );
}

async function Postings() {
  const api = await serverApi(routes.applyList);
  const postings = data(await api.GET("/api/job-postings"));
  return <PostingList initialPostings={postings.map(toPostingSummary)} />;
}
