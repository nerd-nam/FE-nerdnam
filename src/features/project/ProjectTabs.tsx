import { NEW_PROJECT_ID, routes } from "@/shared/routes";
import { Badge } from "@/shared/ui/Badge";
import { Icon } from "@/shared/ui/Icon";
import { TabLink, TabNav } from "@/shared/ui/Tabs";
import type { ProjectStatus } from "./project";
import styles from "./Project.module.css";

// 탭 옆 상태 배지. 디자인에는 "작성 중"(초안)과 "확정"만 있고, "검토 중"은 기획서 4.3 상태를 따라 추가했다.
const STATUS_BADGE = {
  draft: { tone: "warn", label: "작성 중" },
  review: { tone: "info", label: "검토 중" },
  confirmed: { tone: "ok", label: "확정" },
} as const satisfies Record<ProjectStatus, { tone: "warn" | "info" | "ok"; label: string }>;

type ProjectTabsProps = {
  projects: { id: string; title: string; status: ProjectStatus }[]; // 서버의 내 프로젝트 목록 (GET /api/projects)
  currentId: string;
};

// 위쪽 프로젝트 탭. 탭마다 주소(/projects/[id])가 있는 링크 탭이다.
// 주소가 있으니 S06 라이브러리의 "수정"에서 특정 프로젝트 탭을 바로 열 수 있다.
export function ProjectTabs({ projects, currentId }: ProjectTabsProps) {
  return (
    <TabNav label="프로젝트">
      {projects.map((project) => {
        const badge = STATUS_BADGE[project.status];
        return (
          <TabLink key={project.id} href={routes.project(project.id)} current={project.id === currentId}>
            {project.title || "제목 없는 프로젝트"}
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </TabLink>
        );
      })}
      <TabLink href={routes.project(NEW_PROJECT_ID)} current={currentId === NEW_PROJECT_ID} className={styles.addTab}>
        <Icon name="plus" size="sm" />
        추가
      </TabLink>
    </TabNav>
  );
}
