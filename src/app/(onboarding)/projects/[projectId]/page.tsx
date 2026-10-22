import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EMPTY_PROJECT, MOCK_AFFILIATIONS, MOCK_MY_SKILLS, MOCK_PROJECTS } from "@/features/project/mock";
import { ProjectForm } from "@/features/project/ProjectForm";
import { ProjectTabs } from "@/features/project/ProjectTabs";
import { WritingGuide } from "@/features/project/WritingGuide";
import styles from "@/features/project/Project.module.css";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_PROJECT_ID, routes } from "@/shared/routes";
import { onboardingSteps } from "@/shared/steps";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "프로젝트 입력" };

// S04 프로젝트 입력 · 작업: FE-07 (지금: ① 모양 · ② 나누기 완료, ③ 움직임 전)
// 주소: /projects/new (새 프로젝트) 또는 /projects/p_102 (저장된 프로젝트)
// 데이터는 아직 임시 데이터(features/project/mock.ts)를 쓴다.
export default function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
  return (
    <Page>
      <Stepper label="온보딩 단계" steps={onboardingSteps()} current={2} />
      <PageHead
        title="프로젝트를 편하게 적어 주세요"
        desc="형식은 신경 쓰지 않아도 돼요. AI가 [문제]-[해결]-[결과]로 정리하고, 확정은 직접 확인한 뒤에 해요."
      />
      {/* 주소의 프로젝트 번호가 필요한 부분만 Suspense 로 감싼다 (Next.js 16 cacheComponents 규칙) */}
      <Suspense>
        {params.then(({ projectId }) => (
          <ProjectContent projectId={projectId} />
        ))}
      </Suspense>
    </Page>
  );
}

function ProjectContent({ projectId }: { projectId: string }) {
  const isNew = projectId === NEW_PROJECT_ID;
  const project = isNew ? EMPTY_PROJECT : MOCK_PROJECTS.find((item) => item.id === projectId);

  // 없는 번호면 404
  if (!project) notFound();

  return (
    <>
      <ProjectTabs projects={MOCK_PROJECTS} currentId={projectId} />

      <div className={styles.split}>
        <ProjectForm project={project} affiliations={MOCK_AFFILIATIONS} mySkills={MOCK_MY_SKILLS} />
        <WritingGuide />
      </div>

      <div className={styles.actions}>
        <ButtonLink href={routes.career}>이전</ButtonLink>
        {isNew ? (
          // 새 프로젝트는 아직 저장 전이라 번호가 없어 검토 화면으로 갈 수 없다. 저장 흐름은 ③·④ 단계에서 정한다
          <Button variant="primary" disabled>
            <Icon name="restructure" />
            [문제]-[해결]-[결과]로 재구성하기
          </Button>
        ) : (
          <ButtonLink variant="primary" href={routes.review(project.id)}>
            <Icon name="restructure" />
            [문제]-[해결]-[결과]로 재구성하기
          </ButtonLink>
        )}
      </div>
    </>
  );
}
