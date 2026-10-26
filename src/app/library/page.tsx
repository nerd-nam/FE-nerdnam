import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { formatMonth } from "@/features/career/career";
import { toLibraryProject } from "@/features/library/library";
import { ProjectCard } from "@/features/library/ProjectCard";
import styles from "@/features/library/Library.module.css";
import { LEVELS } from "@/features/skills/skill";
import { data, serverApi } from "@/shared/api/server";
import { Page, PageHead } from "@/shared/layout/Page";
import { NEW_JD_ID, NEW_PROJECT_ID, routes } from "@/shared/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Note } from "@/shared/ui/Callout";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { cx } from "@/shared/ui/cx";

export const metadata: Metadata = { title: "내 경험" };

// S06 내 경험 라이브러리 (주소: /library) · 작업: FE-10 (① 모양 · ② 나누기 · ③ 움직임 · ④ 서버 연결)
// 화면에 필요한 것(통계, 프로젝트·확정 사례, 경력 요약, 기술스택 요약)은 요약 API 하나로 서버에서 가져온다 (GET /api/me/library, C-02 S06 확인할 것 1).
// 사례 한 줄 요약("문제 → 해결 → 결과")은 서버가 만들어 준다(summaryLine, 확인할 것 2).
// 확정한 프로젝트의 "수정"만 브라우저에서 서버에 보낸다(재등록 시작, ReregisterButton). 그 밖의 "편집"·"보기"는 이동만 한다.
export default function LibraryPage() {
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
      {/* 로그인 쿠키로 묻는 부분만 Suspense 로 감싼다. 제목과 "새 공고" 버튼은 먼저 보인다 */}
      <Suspense>
        <Library />
      </Suspense>
    </Page>
  );
}

async function Library() {
  const api = await serverApi(routes.library);
  const { stats, projects: apiProjects, careers, skills } = data(await api.GET("/api/me/library"));
  const projects = apiProjects.map(toLibraryProject);

  return (
    <>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>기술</dt>
          <dd>{stats.skillCount}</dd>
        </div>
        <div className={styles.stat}>
          <dt>경력</dt>
          <dd>{stats.careerCount}</dd>
        </div>
        <div className={styles.stat}>
          <dt>확정 프로젝트</dt>
          <dd>
            {stats.confirmedProjectCount} <span className={styles.statSub}>/ {stats.projectCount}</span>
          </dd>
        </div>
        <div className={styles.stat}>
          <dt>확정한 사례</dt>
          <dd>{stats.confirmedEpisodeCount}</dd>
        </div>
      </dl>

      <div className={styles.split}>
        <section className={styles.main} aria-labelledby="proj-title">
          <h2 id="proj-title" className={styles.sectionTitle}>
            프로젝트
          </h2>
          {projects.length === 0 ? (
            // 프로젝트가 하나도 없을 때 (디자인에 없어 FE 가 정함)
            <Card tone="dashed" className={cx(styles.pending, styles.card)}>
              <p className={styles.meta}>아직 프로젝트가 없어요. 프로젝트를 입력하고 사례를 확정하면 공고 매칭에 쓰여요.</p>
              <ButtonLink href={routes.project(NEW_PROJECT_ID)}>프로젝트 입력하기</ButtonLink>
            </Card>
          ) : (
            projects.map((project) => <ProjectCard key={project.id} project={project} />)
          )}
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
            {careers.length === 0 ? (
              <p className={styles.meta}>아직 입력한 경력이 없어요.</p>
            ) : (
              <ul className={styles.list}>
                {careers.map((c) => (
                  <li key={c.id} className={styles.careerItem}>
                    <strong>{c.companyName}</strong>
                    <span className={styles.desc}>{[c.teamName, c.jobTitle].filter(Boolean).join(" · ")}</span>
                    <span className={styles.meta}>
                      {formatMonth(c.startMonth)} – {c.endMonth ? formatMonth(c.endMonth) : "현재"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
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
            {skills.length === 0 ? (
              <p className={styles.meta}>아직 추가한 기술이 없어요.</p>
            ) : (
              <ul className={cx(styles.list, styles.skillList)}>
                {skills.map((s) => (
                  <li key={s.id} className={styles.skillItem}>
                    <span className={styles.skillName}>{s.name}</span>
                    <span className={styles.level}>
                      {LEVELS[s.level - 1]?.name}
                      <span className={styles.meter} aria-hidden="true">
                        {LEVELS.map((l) => (
                          <span key={l.level} className={cx(l.level <= s.level && styles.on)} />
                        ))}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
