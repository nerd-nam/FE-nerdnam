import { routes } from "@/shared/routes";
import { Badge, Tag } from "@/shared/ui/Badge";
import { ButtonLink } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { cx } from "@/shared/ui/cx";
import type { LibraryProject } from "./mock";
import { ReregisterButton } from "./ReregisterButton";
import styles from "./Library.module.css";

// 프로젝트 카드 하나. 상태에 따라 모양과 버튼이 다르다.
// - 확정·재등록 중: 확정한 사례 목록 + "보기"·"수정"
// - 초안: 점선 카드 + "이어서 작성하기"(S04). 검토 결과가 없으니 S04 에서 재구성을 눌러야 한다 (기획서 v1.14 검토 결과 유지 규칙)
// - 검토 중: 점선 카드 + "검토 이어서 하기"(S05). S02·S03 에서 밖으로 나와 검토 결과가 남아 있는 경우
export function ProjectCard({ project }: { project: LibraryProject }) {
  if (project.status === "draft" || project.status === "review") {
    const isDraft = project.status === "draft";
    return (
      <Card as="article" id={project.id} tone="dashed" className={cx(styles.pending, styles.card)}>
        <div className={styles.stack}>
          <div className={styles.row}>
            <Badge tone={isDraft ? "warn" : "info"}>{isDraft ? "초안" : "검토 중"}</Badge>
            <span className={styles.meta}>아직 매칭에 쓰이지 않아요</span>
          </div>
          <h3 className={styles.projectTitle}>{project.title}</h3>
        </div>
        <ButtonLink href={isDraft ? routes.project(project.id) : routes.review(project.id)}>
          {isDraft ? "이어서 작성하기" : "검토 이어서 하기"}
        </ButtonLink>
      </Card>
    );
  }

  const reregistering = project.status === "reregistering";
  return (
    // id: /library#p_106 처럼 주소로 이 카드에 바로 올 수 있게 한다 (S08 재등록 중 근거, FE-nerdnam #4)
    <Card as="article" id={project.id} className={styles.card}>
      <div className={`${styles.row} ${styles.between}`}>
        <div className={styles.stack}>
          <div className={styles.row}>
            {reregistering ? (
              <Badge tone="info">재등록 중 · 이전 사례 {project.episodes.length}개 사용 중</Badge>
            ) : (
              <Badge tone="ok">확정 · 사례 {project.episodes.length}개</Badge>
            )}
            {project.meta && <span className={styles.meta}>{project.meta}</span>}
          </div>
          <h3 className={styles.projectTitle}>{project.title}</h3>
        </div>
        <div className={styles.row}>
          {reregistering ? (
            // 재등록 중이면 이미 고치는 중이니 안내 없이 이어서 고친다
            <ButtonLink size="sm" href={routes.project(project.id)}>
              이어서 수정하기
            </ButtonLink>
          ) : (
            <>
              <ButtonLink size="sm" href={routes.review(project.id)}>
                보기
              </ButtonLink>
              <ReregisterButton projectId={project.id} title={project.title} />
            </>
          )}
        </div>
      </div>

      <ul className={styles.episodes}>
        {project.episodes.map((ep, index) => (
          <li key={ep.title} className={styles.episode}>
            <span className={styles.episodeNum}>사례 {index + 1}</span>
            <span>
              <strong>{ep.title}</strong>
              <br />
              <span className={styles.episodeSummary}>{ep.summary}</span>
            </span>
          </li>
        ))}
      </ul>

      {project.skills.length > 0 && (
        <div className={styles.row}>
          {project.skills.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </div>
      )}
    </Card>
  );
}
