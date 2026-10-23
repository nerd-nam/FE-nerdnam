import type { Metadata } from "next";
import { MOCK_POSTINGS } from "@/features/apply/mock";
import { PostingList } from "@/features/apply/PostingList";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_JD_ID, routes } from "@/shared/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";

export const metadata: Metadata = { title: "지원 준비" };

// S10 공고 목록 (주소: /apply) · 작업: FE-18 (지금: ① 모양 · ② 나누기 · ③ 움직임(화면 안에서만), ④ 조회·삭제 전)
// 머리글 "지원 준비" 메뉴가 여기로 온다. 디자인: design/apply.html (기획서 v1.31). 지원 상태·공고 간 비교는 P2.
// 데이터는 임시 데이터(features/apply/mock.ts). 모두 지우면 "아직 공고가 없어요" 안내가 보인다.
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
      <PostingList initialPostings={MOCK_POSTINGS} />
    </Page>
  );
}
