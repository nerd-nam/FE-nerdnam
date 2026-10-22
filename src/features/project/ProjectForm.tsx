import Link from "next/link";
import { routes } from "@/shared/routes";
import { buttonClass } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Field, Input, Select, Textarea } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { cx } from "@/shared/ui/cx";
import type { Option, Project } from "./mock";
import { SkillPicker } from "./SkillPicker";
import styles from "./Project.module.css";

type ProjectFormProps = {
  project: Project;
  affiliations: Option[]; // 소속 선택지
  mySkills: string[]; // 사용 기술 선택지
};

// 본문 글자 수 (공백 제외, 디자인 project.js 와 같은 방식)
function countChars(text: string) {
  return text.replace(/\s/g, "").length;
}

// S04 왼쪽 큰 카드: 프로젝트 내용 입력
// 지금은 모양만 있다(① 모양 단계). 입력값은 defaultValue 로 처음 값만 채워 두고,
// 글자 수·기술 고르기·저장은 다음 단계(③ 움직임)에서 붙인다.
export function ProjectForm({ project, affiliations, mySkills }: ProjectFormProps) {
  return (
    <Card size="lg" className={styles.main} aria-label="프로젝트 내용">
      <div className={styles.grid2}>
        <div className={styles.span2}>
          <Field id="title" label="프로젝트 제목">
            <Input id="title" defaultValue={project.title} placeholder="예: 결제 승인 API 성능 개선" />
          </Field>
        </div>

        {/* 기간: 라벨 하나에 입력칸이 둘이라 Field 대신 직접 만든다. 각 칸에는 화면에 안 보이는 라벨을 단다 */}
        <div>
          <span className={styles.label}>기간</span>
          <div className={styles.range}>
            <label htmlFor="period-start" className="sr-only">
              시작 월
            </label>
            <Input id="period-start" type="month" defaultValue={project.period.start} />
            <span aria-hidden="true" className={styles.rangeDash}>
              –
            </span>
            <label htmlFor="period-end" className="sr-only">
              종료 월
            </label>
            <Input id="period-end" type="month" defaultValue={project.period.end} />
          </div>
        </div>

        <div>
          <Field id="affiliation" label="소속">
            <Select id="affiliation" defaultValue={project.affiliation}>
              {project.affiliation === "" && <option value="">선택해 주세요</option>}
              {affiliations.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Link href={routes.career} className={styles.inlineLink}>
            목록에 없는 경력 추가·수정 <Icon name="arrow" size="sm" />
          </Link>
        </div>
      </div>

      <SkillPicker options={mySkills} selected={project.skills} />

      <div>
        <div className={cx(styles.row, styles.between)}>
          <label htmlFor="raw-text" className={styles.label}>
            무슨 일이 있었나요?
          </label>
          <span className={styles.meta}>{countChars(project.rawText)}자 · 200자 이상 권장</span>
        </div>
        <Textarea id="raw-text" rows={9} defaultValue={project.rawText} />
      </div>

      <div className={styles.grid2}>
        <Field id="repo-url" label="GitHub 링크" hint="(선택)">
          <Input id="repo-url" type="url" placeholder="https://github.com/…" defaultValue={project.repoUrl} />
        </Field>
        <Field id="demo-url" label="배포·문서 링크" hint="(선택)">
          <Input id="demo-url" type="url" placeholder="https://…" defaultValue={project.demoUrl} />
        </Field>
      </div>

      <div className={styles.upload}>
        <Icon name="image" size="lg" className={styles.uploadIcon} />
        <span className={styles.uploadText}>화면 캡처나 구조도가 있다면 올려 주세요. 포트폴리오 방향을 잡을 때 참고해요.</span>
        {/* 진짜 파일 선택칸은 숨기고, 버튼 모양 라벨을 누르면 열리게 한다 */}
        <label htmlFor="image-upload" className={buttonClass({})}>
          이미지 선택
        </label>
        <input id="image-upload" type="file" accept="image/*" className="sr-only" />
      </div>
    </Card>
  );
}
