import type { Metadata } from "next";
import { Suspense } from "react";
import { SkillsBoard } from "@/features/skills/SkillsBoard";
import { toMySkill, type Category } from "@/features/skills/skill";
import { data, serverApi } from "@/shared/api/server";
import { Page, PageHead } from "@/shared/layout/Page";
import { routes } from "@/shared/routes";
import { onboardingSteps } from "@/shared/steps";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "기술스택 입력" };

// 처음 보여 줄 카테고리 (디자인 skills.html 은 프레임워크가 눌려 있다)
const FIRST_CATEGORY: Category = "framework";

// S02 기술스택 입력 (주소: /skills, 검토 중에 오면 /skills?review=102) · 작업: FE-05 (① 모양 · ② 나누기 · ③ 움직임 · ④ 서버 연결)
// 화면을 열 때 필요한 것(내 기술, 첫 카테고리의 추천 칩)은 서버에서 가져온다.
// 다른 카테고리 칩과 검색 자동완성은 화면을 보는 동안 바뀌어서 브라우저에서 가져온다(SkillsBoard).
// 추가·숙련도·삭제는 화면에서만 바꿔 두고 "다음"(또는 이전·검토로 돌아가기·저장하고 나중에 하기)에서 한 번에 저장한다 (FE 결정 2026-10-26).
export default function SkillsPage({ searchParams }: PageProps<"/skills">) {
  return (
    <Page width="narrow">
      <Stepper label="온보딩 단계" steps={onboardingSteps()} current={0} />
      <PageHead
        title="기술스택을 알려주세요"
        desc="공고 문구와 정확히 맞추기 위해 기술명은 표준 이름으로 저장돼요. 예: react.js, 리액트 → React"
      />
      {/* 로그인 쿠키로 묻는 데이터와 ?review= 값이 필요한 부분만 Suspense 로 감싼다 */}
      <Suspense>
        {searchParams.then((sp) => (
          <Skills reviewId={typeof sp.review === "string" ? sp.review : undefined} />
        ))}
      </Suspense>
    </Page>
  );
}

async function Skills({ reviewId }: { reviewId?: string }) {
  const api = await serverApi(reviewId ? `${routes.skills}?review=${reviewId}` : routes.skills);
  // 두 요청은 서로 기다릴 필요가 없어서 동시에 보낸다
  const [mine, catalog] = await Promise.all([
    api.GET("/api/me/skills"),
    api.GET("/api/skills", { params: { query: { category: FIRST_CATEGORY } } }),
  ]);
  return (
    <SkillsBoard
      initialSkills={data(mine).map(toMySkill)}
      firstCategory={FIRST_CATEGORY}
      firstCatalog={data(catalog).map((s) => ({ name: s.name, category: s.category }))}
      reviewId={reviewId}
    />
  );
}
