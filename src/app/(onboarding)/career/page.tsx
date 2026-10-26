import type { Metadata } from "next";
import { Suspense } from "react";
import { CareerBoard } from "@/features/career/CareerBoard";
import { toCareer } from "@/features/career/career";
import styles from "@/features/career/Career.module.css";
import { LeaveGuard } from "@/features/onboarding/LeaveGuard";
import { data, serverApi } from "@/shared/api/server";
import { Page, PageHead } from "@/shared/layout/Page";
import { SaveLaterLink } from "@/shared/layout/PendingSave";
import { NEW_PROJECT_ID, routes } from "@/shared/routes";
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
              {reviewId && <LeaveGuard active mode="enter-original" />}
              <Stepper label="온보딩 단계" steps={onboardingSteps(reviewId)} current={1} />
              <PageHead
                title="경력을 입력해 주세요"
                desc="최근 경력부터 적어 주세요. 공고의 연차 조건은 여기 적은 재직기간으로 계산해요."
                actions={
                  // 저장하지 않은 변경이 있으면 확인창을 거친다 (CareerBoard 가 맡긴 확인)
                  <SaveLaterLink href={routes.project(NEW_PROJECT_ID)} className={styles.skip}>
                    경력이 없어요 (건너뛰기)
                  </SaveLaterLink>
                }
              />
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
  const [careers, skills] = await Promise.all([api.GET("/api/me/careers"), api.GET("/api/me/skills")]);
  return (
    <CareerBoard
      initialCareers={data(careers).map(toCareer)}
      mySkills={data(skills).map((s) => ({ id: s.id, name: s.name }))}
      reviewId={reviewId}
    />
  );
}
