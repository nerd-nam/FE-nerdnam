import type { Metadata } from "next";
import { Suspense } from "react";
import { EMPTY_DRAFT, toDraft, type AffiliationValue } from "@/features/project/project";
import { ProjectEditor } from "@/features/project/ProjectEditor";
import { ProjectLocked } from "@/features/project/ProjectLocked";
import { ProjectTabs } from "@/features/project/ProjectTabs";
import { WritingGuide } from "@/features/project/WritingGuide";
import { data, serverApi } from "@/shared/api/server";
import { dataKey } from "@/shared/dataKey";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_PROJECT_ID, routes } from "@/shared/routes";
import { onboardingSteps } from "@/shared/steps";
import { Stepper } from "@/shared/ui/Stepper";

export const metadata: Metadata = { title: "프로젝트 입력" };

// S04 프로젝트 입력 · 작업: FE-07 (① 모양 · ② 나누기 · ③ 움직임 · ④ 서버 연결)
// 주소: /projects/new (새 프로젝트) 또는 /projects/102 (저장된 프로젝트)
// 화면을 열 때 필요한 것(내 프로젝트 목록 = 위 탭, 이 프로젝트, 소속 선택지 = 내 경력, 사용 기술 선택지 = 내 기술스택)은 서버에서 가져온다.
// 저장·재구성·삭제는 브라우저에서 보낸다 (ProjectEditor). 검토 중·확정 프로젝트는 양식 대신 안내 카드 (ProjectLocked).
export default function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
  return (
    <Page>
      <Stepper label="온보딩 단계" steps={onboardingSteps()} current={2} />
      <PageHead
        title="프로젝트를 편하게 적어 주세요"
        desc="형식은 신경 쓰지 않아도 돼요. AI가 [문제]-[해결]-[결과]로 정리하고, 확정은 직접 확인한 뒤에 해요."
      />
      {/* 주소의 프로젝트 번호와 로그인 쿠키가 필요한 부분만 Suspense 로 감싼다 (Next.js 16 cacheComponents 규칙) */}
      <Suspense>
        {params.then(({ projectId }) => (
          <ProjectContent projectId={projectId} />
        ))}
      </Suspense>
    </Page>
  );
}

// 회사 밖 프로젝트 선택지 (C-02 S04 확인할 것 3: affiliation personal·team)
const OUTSIDE: { value: AffiliationValue; label: string }[] = [
  { value: "personal", label: "개인 프로젝트" },
  { value: "team", label: "팀 프로젝트 (회사 외)" },
];

async function ProjectContent({ projectId }: { projectId: string }) {
  const isNew = projectId === NEW_PROJECT_ID;
  const api = await serverApi(routes.project(projectId));
  // 서로 기다릴 필요가 없어서 동시에 보낸다. 새 프로젝트는 상세 조회가 없다
  const [list, careers, skills, detail] = await Promise.all([
    api.GET("/api/projects"),
    api.GET("/api/me/careers"),
    api.GET("/api/me/skills"),
    isNew ? null : api.GET("/api/projects/{projectId}", { params: { path: { projectId: Number(projectId) || -1 } } }),
  ]);
  const project = detail ? data(detail) : null; // 없는 번호·남의 프로젝트면 404 화면

  const tabs = data(list).map((p) => ({ id: String(p.id), title: p.title, status: p.status }));
  const affiliations = [
    ...data(careers).map((c) => ({ value: `career:${c.id}` as const, label: [c.companyName, c.teamName].filter(Boolean).join(" · ") })),
    ...OUTSIDE,
  ];
  const initial = project ? toDraft(project) : EMPTY_DRAFT;
  const runningJobId = project?.runningJobId ?? null;
  const mySkills = data(skills).map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      <ProjectTabs projects={tabs} currentId={projectId} />
      {project && project.status !== "draft" ? (
        <ProjectLocked projectId={project.id} title={project.title} status={project.status} />
      ) : (
        <ProjectEditor
          // key: 프로젝트가 바뀌면 양식을 새로 만든다 (이전 프로젝트에서 고른 기술·입력한 글이 남지 않게).
          // 같은 프로젝트라도 다시 왔을 때 서버 값(내용·재구성 작업·소속·기술 선택지)이 바뀌었으면 새로 시작한다 (shared/dataKey)
          key={dataKey([projectId, initial, runningJobId, affiliations, mySkills])}
          initial={initial}
          runningJobId={runningJobId}
          affiliations={affiliations}
          mySkills={mySkills}
          guide={<WritingGuide />}
        />
      )}
    </>
  );
}
