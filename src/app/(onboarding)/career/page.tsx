import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CareerBoard } from "@/features/career/CareerBoard";
import { MOCK_CAREERS } from "@/features/career/mock";
import styles from "@/features/career/Career.module.css";
import { LeaveGuard } from "@/features/onboarding/LeaveGuard";
import { OnboardingActions } from "@/features/onboarding/OnboardingActions";
import { MOCK_MY_SKILLS } from "@/features/skills/mock";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_PROJECT_ID, routes } from "@/shared/routes";
import { onboardingSteps } from "@/shared/steps";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "경력 입력" };

// S03 경력 입력 (주소: /career, 검토 중에 오면 /career?review=p_102) · 작업: FE-06
// 지금: ① 모양 · ② 나누기 · ③ 움직임(화면 안에서만). 저장 API(④)는 API 가 생기면 붙인다.
// "다음"과 "건너뛰기"는 새 프로젝트(/projects/new)로 간다.
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
                  <Link href={routes.project(NEW_PROJECT_ID)} className={styles.skip}>
                    경력이 없어요 (건너뛰기)
                  </Link>
                }
              />
              <CareerBoard initialCareers={MOCK_CAREERS} mySkills={MOCK_MY_SKILLS.map((s) => s.name)} />
              <OnboardingActions
                prev={{ href: routes.skills }}
                next={{ href: routes.project(NEW_PROJECT_ID), label: "다음: 프로젝트 입력" }}
                reviewId={reviewId}
              />
            </>
          );
        })}
      </Suspense>
    </Page>
  );
}
