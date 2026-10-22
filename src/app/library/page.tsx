import type { Metadata } from "next";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_JD_ID, routes } from "@/shared/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Icon } from "@/shared/ui/Icon";

export const metadata: Metadata = { title: "내 경험" };

// S06 내 경험 라이브러리 (주소: /library) · 채우는 작업: FE-10
export default function LibraryPage() {
  return (
    <Page>
      <PageHead
        title="내 경험"
        desc="지원서의 근거로 쓰이는 데이터예요. 확정된 항목만 공고 매칭에 쓰여요."
        actions={
          <ButtonLink variant="primary" href={routes.jd(NEW_JD_ID)}>
            <Icon name="plus" />새 공고로 지원 준비
          </ButtonLink>
        }
      />
      <Callout tone="sunken" icon="info">
        FE-10 에서 만들 예정이에요.
      </Callout>
    </Page>
  );
}
