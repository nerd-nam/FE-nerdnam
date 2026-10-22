import { Header } from "@/shared/layout/Header";

// S07~S09 지원 준비 화면들은 메뉴가 있는 머리글을 쓴다.
export default function ApplyLayout({ children }: LayoutProps<"/apply">) {
  return (
    <>
      <Header variant="app" area="apply" />
      {children}
    </>
  );
}
