import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { Page, PageHead } from "@/shared/layout/Page";
import { routes } from "@/shared/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";

// S01 시작하기 (주소: /)
// 지금은 뼈대만 있다. 디자인(design/index.html)대로 채우는 일은 FE-04 에서 한다.
export default function StartPage() {
  return (
    <>
      <Header variant="start" />
      <Page grow>
        <PageHead title="경험은 한 번 정리하고, 방향은 공고마다." meta="처음 한 번 · 약 15분" />
        <Callout tone="sunken" icon="info">
          S01 시작 화면은 FE-04 에서 만들 예정이에요.
        </Callout>
        <div>
          <ButtonLink variant="primary" size="lg" href={routes.skills}>
            이메일로 시작하기
          </ButtonLink>
        </div>
      </Page>
      <Footer />
    </>
  );
}
