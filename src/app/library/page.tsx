import type { Metadata } from "next";
import Link from "next/link";
import { MOCK_CAREERS, formatMonth } from "@/features/career/mock";
import { MOCK_LIBRARY_PROJECTS } from "@/features/library/mock";
import { ProjectCard } from "@/features/library/ProjectCard";
import styles from "@/features/library/Library.module.css";
import { LEVELS, MOCK_MY_SKILLS } from "@/features/skills/mock";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_JD_ID, routes } from "@/shared/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Note } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { cx } from "@/shared/ui/cx";

export const metadata: Metadata = { title: "내 경험" };

// S06 내 경험 라이브러리 (주소: /library) · 작업: FE-10
// 데이터는 임시 데이터(features/library, career, skills 의 mock)를 쓴다. 저장할 것이 없는 화면이라 ③까지 끝이고 ④는 조회 API 연결뿐이다.
export default function LibraryPage() {
  const projects = MOCK_LIBRARY_PROJECTS;
  const decided = projects.filter((p) => p.status === "confirmed" || p.status === "reregistering");
  const episodeCount = decided.reduce((sum, p) => sum + p.episodes.length, 0);

  return (
    <Page>
      <PageHead
        title="내 경험"
        desc="지원서의 근거로 쓰이는 데이터예요. 확정된 항목만 공고 매칭에 쓰여요."
        actions={
          <ButtonLink variant="primary" href={routes.jd(NEW_JD_ID)}>
            <Icon name="plus" />새 공고로 지원 준비
          </ButtonLink>
        }
      />

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>기술</dt>
          <dd>{MOCK_MY_SKILLS.length}</dd>
        </div>
        <div className={styles.stat}>
          <dt>경력</dt>
          <dd>{MOCK_CAREERS.length}</dd>
        </div>
        <div className={styles.stat}>
          <dt>확정 프로젝트</dt>
          <dd>
            {decided.length} <span className={styles.statSub}>/ {projects.length}</span>
          </dd>
        </div>
        <div className={styles.stat}>
          <dt>확정한 사례</dt>
          <dd>{episodeCount}</dd>
        </div>
      </dl>

      <div className={styles.split}>
        <section className={styles.main} aria-labelledby="proj-title">
          <h2 id="proj-title" className={styles.sectionTitle}>
            프로젝트
          </h2>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          <Note>확정한 프로젝트를 고치면 원문 입력부터 다시 거친 뒤 매칭에 반영돼요. 그전까지는 지금 사례가 계속 쓰여요.</Note>
        </section>

        <aside className={styles.side}>
          <Card size="sm" aria-labelledby="career-title">
            <div className={styles.sideHead}>
              <h2 id="career-title" className={styles.sideTitle}>
                경력
              </h2>
              <Link href={routes.career} className={styles.edit}>
                편집
              </Link>
            </div>
            <ul className={styles.list}>
              {MOCK_CAREERS.map((c) => (
                <li key={c.id} className={styles.careerItem}>
                  <strong>{c.company}</strong>
                  <span className={styles.desc}>{[c.team, c.jobTitle].filter(Boolean).join(" · ")}</span>
                  <span className={styles.meta}>
                    {formatMonth(c.start)} – {c.end ? formatMonth(c.end) : "현재"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card size="sm" aria-labelledby="skill-title">
            <div className={styles.sideHead}>
              <h2 id="skill-title" className={styles.sideTitle}>
                기술스택
              </h2>
              <Link href={routes.skills} className={styles.edit}>
                편집
              </Link>
            </div>
            <ul className={cx(styles.list, styles.skillList)}>
              {MOCK_MY_SKILLS.map((s) => (
                <li key={s.name} className={styles.skillItem}>
                  <span className={styles.skillName}>{s.name}</span>
                  <span className={styles.level}>
                    {LEVELS[s.level - 1].name}
                    <span className={styles.meter} aria-hidden="true">
                      {LEVELS.map((l) => (
                        <span key={l.level} className={cx(l.level <= s.level && styles.on)} />
                      ))}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </Page>
  );
}
