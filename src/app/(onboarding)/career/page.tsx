import type { Metadata } from "next";
import { Suspense } from "react";
import { CareerBoard } from "@/features/career/CareerBoard";
import { toCareer } from "@/features/career/career";
import { LeaveGuard } from "@/features/onboarding/LeaveGuard";
import { data, serverApi } from "@/shared/api/server";
import { dataKey } from "@/shared/dataKey";
import { Page } from "@/shared/layout/Page";
import { routes } from "@/shared/routes";
import { onboardingSteps } from "@/shared/steps";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "경력 입력" };

// S03 경력 입력 (주소: /career, 검토 중에 오면 /career?review=102) · 작업: FE-06 (① 모양 · ② 나누기 · ③ 움직임 · ④ 서버 연결)
// 화면을 열 때 필요한 것(내 경력, "이 회사에서 쓴 기술" 선택지인 내 기술스택)은 서버에서 가져온다.
// 저장·삭제는 버튼을 눌렀을 때 브라우저에서 보낸다(CareerBoard). "다음"과 "건너뛰기"는 새 프로젝트(/projects/new)로 간다.
// "건너뛰기"는 서버에 따로 남기지 않는다 — 경력·프로젝트가 모두 없을 때만 다음 단계가 경력이라, 프로젝트를 만들면 넘어간다 (C-02 S03 확인할 것 3).
export default function CareerPage({ searchParams }: PageProps<"/career">) {
  return (
    <Page width="mid">
      <Suspense>
        {searchParams.then((sp) => {
          const reviewId = typeof sp.review === "string" ? sp.review : undefined;
          return (
            <>
              {/* 검토 중에 왔으면 S04(원문 화면)로 갈 때만 경고. 단계 표시의 S02 링크에도 ?review 를 이어 붙인다 */}
              {reviewId && <LeaveGuard active mode="enter-original" discardProjectId={Number(reviewId)} />}
              <Stepper label="온보딩 단계" steps={onboardingSteps(reviewId)} current={1} />
              {/* 제목과 "경력이 없어요 (건너뛰기)"는 CareerBoard 가 그린다 — 경력을 저장하면 건너뛰기를 숨겨야 해서 */}
              <Careers reviewId={reviewId} />
            </>
          );
        })}
      </Suspense>
    </Page>
  );
}

async function Careers({ reviewId }: { reviewId?: string }) {
  const api = await serverApi(reviewId ? `${routes.career}?review=${reviewId}` : routes.career);
  // 두 요청은 서로 기다릴 필요가 없어서 동시에 보낸다
  const [careerList, skillList] = await Promise.all([api.GET("/api/me/careers"), api.GET("/api/me/skills")]);
  const careers = data(careerList).map(toCareer);
  const skills = data(skillList).map((s) => ({ id: s.id, name: s.name }));
  return (
    <CareerBoard
      // key: 다시 왔을 때 서버의 경력·기술이 바뀌었으면(S02 에서 기술 추가 등) 새 값으로 다시 시작한다 (shared/dataKey)
      key={dataKey([careers, skills, reviewId])}
      initialCareers={careers}
      mySkills={skills}
      reviewId={reviewId}
    />
  );
}
