import { Header } from "@/shared/layout/Header";

// S06 라이브러리는 메뉴가 있는 머리글을 쓴다.
export default function LibraryLayout({ children }: LayoutProps<"/library">) {
  return (
    <>
      <Header variant="app" area="library" />
      {children}
    </>
  );
}
