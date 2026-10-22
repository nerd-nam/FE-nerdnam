import Link from "next/link";
import { routes } from "@/shared/routes";
import { Card } from "@/shared/ui/Card";
import { Field, Input, Select } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import type { Option, Project } from "./mock";
import { RawTextField } from "./RawTextField";
import { SkillPicker } from "./SkillPicker";
import styles from "./Project.module.css";

type ProjectFormProps = {
  project: Project;
  affiliations: Option[]; // 소속 선택지
  mySkills: string[]; // 사용 기술 선택지
};

// S04 왼쪽 큰 카드: 프로젝트 내용 입력
// 이 카드 자체는 서버 컴포넌트다. 움직이는 부분(본문 글자 수, 기술 고르기)만 클라이언트 컴포넌트로 떼어 냈다.
// 나머지 칸은 defaultValue(처음 값)만 채워 두면 브라우저가 알아서 입력을 받는다.
// 칸마다 붙인 name 은 저장(④ 데이터)할 때 양식 값을 모으는 데 쓴다.
export function ProjectForm({ project, affiliations, mySkills }: ProjectFormProps) {
  return (
    <Card size="lg" className={styles.main} aria-label="프로젝트 내용">
      <div className={styles.grid2}>
        <div className={styles.span2}>
          <Field id="title" label="프로젝트 제목">
            <Input id="title" name="title" defaultValue={project.title} placeholder="예: 결제 승인 API 성능 개선" />
          </Field>
        </div>

        {/* 기간: 라벨 하나에 입력칸이 둘이라 Field 대신 직접 만든다. 각 칸에는 화면에 안 보이는 라벨을 단다 */}
        <div>
          <span className={styles.label}>기간</span>
          <div className={styles.range}>
            <label htmlFor="period-start" className="sr-only">
              시작 월
            </label>
            <Input id="period-start" name="periodStart" type="month" defaultValue={project.period.start} />
            <span aria-hidden="true" className={styles.rangeDash}>
              –
            </span>
            <label htmlFor="period-end" className="sr-only">
              종료 월
            </label>
            <Input id="period-end" name="periodEnd" type="month" defaultValue={project.period.end} />
          </div>
        </div>

        <div>
          <Field id="affiliation" label="소속">
            <Select id="affiliation" name="affiliation" defaultValue={project.affiliation}>
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

      <SkillPicker initialOptions={mySkills} initialSelected={project.skills} />

      <RawTextField initialText={project.rawText} />

      <div className={styles.grid2}>
        <Field id="repo-url" label="GitHub 링크" hint="(선택)">
          <Input id="repo-url" name="repoUrl" type="url" placeholder="https://github.com/…" defaultValue={project.repoUrl} />
        </Field>
        <Field id="demo-url" label="배포·문서 링크" hint="(선택)">
          <Input id="demo-url" name="demoUrl" type="url" placeholder="https://…" defaultValue={project.demoUrl} />
        </Field>
      </div>

      {/* 이미지 업로드는 받지 않는다 (ADR-0004, 기획서 F1) */}
    </Card>
  );
}
