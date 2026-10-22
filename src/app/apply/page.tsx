import type { Metadata } from "next";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_JD_ID, routes } from "@/shared/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Icon } from "@/shared/ui/Icon";

export const metadata: Metadata = { title: "지원 준비" };

// S10 공고 목록 (주소: /apply) · 채우는 작업: FE-18
// 머리글 "지원 준비" 메뉴가 여기로 온다. 지원 상태·공고 간 비교는 P2 (기획서 v1.11).
// 화면 디자인은 아직 없다.
export default function ApplyListPage() {
  return (
    <Page>
      <PageHead
        title="지원 준비"
        desc="지원할 공고마다 적합도 리포트와 작성 방향을 받아요."
        actions={
          <ButtonLink variant="primary" href={routes.jd(NEW_JD_ID)}>
            <Icon name="plus" />새 공고
          </ButtonLink>
        }
      />
      <Callout tone="sunken" icon="info">
        공고 목록은 FE-18 에서 만들 예정이에요.
      </Callout>
    </Page>
  );
}
