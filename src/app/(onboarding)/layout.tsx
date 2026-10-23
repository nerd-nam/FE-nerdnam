import { Header } from "@/shared/layout/Header";

// (onboarding) 처럼 괄호로 감싼 폴더는 "라우트 그룹"이다. 주소에는 나타나지 않는다.
//   (onboarding)/skills/page.tsx → 주소는 /skills (/onboarding/skills 가 아님)
// 주소는 그대로 두고, S02~S04 가 같은 머리글을 쓰도록 묶는 용도로 쓴다.
// S05 는 확정한 프로젝트면 앱 머리글을 써야 해서 (review) 그룹에 따로 두고 머리글을 직접 고른다.
// 레이아웃은 화면을 옮겨 다녀도 다시 그려지지 않아서, 머리글이 깜빡이지 않는다.
export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header variant="onboarding" />
      {children}
    </>
  );
}
