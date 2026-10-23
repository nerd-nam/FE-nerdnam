"use client";

// S07 의 움직이는 부분: 양식 전체 값, 검증, 입력 현황, "적합도 분석하기".
// 오류 요약(화면 위)·입력 현황(오른쪽)·버튼 안내(아래)가 모두 양식 전체 값을 봐야 해서, 값은 여기 한곳에서 든다.
// 검증 메시지는 "적합도 분석하기"를 처음 눌렀을 때부터 보여 주고, 그 뒤로는 고칠 때마다 바로 갱신한다 (기획서 F4).
//
// ④ 에서 붙일 것 (C-02 S07):
// - 자동 임시 저장 (확인할 것 1·2번: 새 공고 첫 저장 때 주소를 바꿀지, 서버/브라우저 중 어디에 둘지)
// - 서버 검증 오류를 줄 아래에 띄우기 (확인할 것 3번)
// - 요건 정보 추출 실패: "분석을 시작하지 못했어요 …" + 다시 시도 (기획서 F4 표 마지막 줄, 확인할 것 4번)
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { routes } from "@/shared/routes";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Callout } from "@/shared/ui/Callout";
import { Card, CardTitle } from "@/shared/ui/Card";
import { Field, Input, Textarea, fieldErrorId } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import { LineList, type LineListProps } from "./LineList";
import { MESSAGES, filledLines, lineError, type Line } from "./lines";
import type { JdDraft } from "./mock";
import styles from "./Jd.module.css";

type ListKey = "required" | "preferred" | "duties";

// 목록 칸 3개의 글자들 (원본: design/assets/js/jd.js 의 SECTIONS)
const SECTIONS: (Pick<LineListProps, "title" | "required" | "where" | "desc" | "placeholder" | "addLabel"> & { key: ListKey })[] = [
  {
    key: "required",
    title: "필수사항",
    required: true,
    where: "적합도 판정의 기준",
    desc: "공고의 ‘자격 요건’, ‘필수 사항’을 한 줄에 하나씩 적어 주세요.",
    placeholder: "예: Java/Spring 기반 개발 경력 3년 이상",
    addLabel: "필수사항 추가",
  },
  {
    key: "preferred",
    title: "우대사항",
    where: "있으면 유리한 조건",
    desc: "공고의 ‘우대 사항’, ‘이런 분이면 더 좋아요’를 한 줄에 하나씩 적어 주세요.",
    placeholder: "예: Kafka 등 메시지 큐 운영 경험",
    addLabel: "우대사항 추가",
  },
  {
    key: "duties",
    title: "주요 업무",
    where: "지원동기 작성에 써요",
    desc: "입사하면 맡게 될 일을 적어 주세요. 적합도 판정에는 쓰지 않아요.",
    placeholder: "예: 결제 승인·정산 시스템 개발 및 운영",
    addLabel: "주요 업무 추가",
  },
];

type JdFormProps = {
  initial: JdDraft;
  reportJdId: string; // 분석이 끝나면 갈 리포트의 공고 번호 (지금은 임시 번호)
  guide: ReactNode; // 오른쪽 작성 가이드. 움직이지 않는 부분이라 서버 컴포넌트로 받아 이 자리에 놓는다
};

export function JdForm({ initial, reportJdId, guide }: JdFormProps) {
  const router = useRouter();

  // 줄 번호표. 처음 줄은 "required-0" 처럼 정해진 번호를, 새 줄은 "line-1", "line-2" … 를 준다
  const seq = useRef(0);
  function newLine(text = ""): Line {
    seq.current += 1;
    return { id: `line-${seq.current}`, text };
  }
  const toLines = (key: ListKey) => initial[key].map((text, index) => ({ id: `${key}-${index}`, text }));

  const [company, setCompany] = useState(initial.company);
  const [position, setPosition] = useState(initial.position);
  const [url, setUrl] = useState(initial.url);
  const [intro, setIntro] = useState(initial.intro);
  const [lists, setLists] = useState<Record<ListKey, Line[]>>(() => ({
    required: toLines("required"),
    preferred: toLines("preferred"),
    duties: toLines("duties"),
  }));
  const [submitted, setSubmitted] = useState(false);

  // 오류 세기. 회사명·포지션·필수사항 0개는 각각 1개, 목록은 오류 있는 줄마다 1개
  const companyError = submitted && !company.trim() ? MESSAGES.company : null;
  const positionError = submitted && !position.trim() ? MESSAGES.position : null;
  const counts = {
    required: filledLines(lists.required).length,
    preferred: filledLines(lists.preferred).length,
    duties: filledLines(lists.duties).length,
  };
  const lineErrors = SECTIONS.reduce((sum, { key }) => sum + lists[key].filter((line) => lineError(lists[key], line)).length, 0);
  const isValid = !!company.trim() && !!position.trim() && counts.required > 0 && lineErrors === 0;
  const errorCount = submitted ? [companyError, positionError, counts.required === 0].filter(Boolean).length + lineErrors : 0;

  // 처음 눌렀을 때 첫 번째 오류 칸으로 커서를 옮긴다. 오류 표시가 그려진 다음이어야 해서 effect 에서 한다
  const formRef = useRef<HTMLDivElement>(null);
  const [focusErrorTick, setFocusErrorTick] = useState(0);
  useEffect(() => {
    if (focusErrorTick === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusErrorTick]);

  function analyze() {
    if (isValid) {
      // TODO(④): 서버에 저장 → 분석 시작 → 리포트로. 지금은 임시 리포트로 바로 간다
      router.push(routes.report(reportJdId));
      return;
    }
    setSubmitted(true);
    setFocusErrorTick((tick) => tick + 1);
  }

  return (
    <div ref={formRef} className={styles.form}>
      {errorCount > 0 && (
        <Callout tone="bad" icon="alert" role="alert">
          <strong>고쳐야 할 항목이 {errorCount}개 있어요.</strong> 빨간색으로 표시된 곳을 확인해 주세요.
        </Callout>
      )}

      <div className={styles.split}>
        <div className={styles.main}>
          <Card aria-labelledby="basic-title">
            <CardTitle id="basic-title">기본 정보</CardTitle>
            <div className={styles.grid2}>
              <Field id="company" label="회사명" required error={companyError}>
                <Input
                  id="company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="예: OO페이"
                  invalid={!!companyError}
                  aria-describedby={companyError ? fieldErrorId("company") : undefined}
                />
              </Field>
              <Field id="position" label="포지션" required error={positionError}>
                <Input
                  id="position"
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  placeholder="예: 백엔드 개발자"
                  invalid={!!positionError}
                  aria-describedby={positionError ? fieldErrorId("position") : undefined}
                />
              </Field>
              <div className={styles.span2}>
                <Field id="url" label="공고 링크" hint="(선택 · 나중에 다시 보기용)">
                  <Input id="url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" />
                </Field>
              </div>
            </div>
          </Card>

          {SECTIONS.map(({ key, ...section }) => (
            <LineList
              key={key}
              name={key}
              {...section}
              lines={lists[key]}
              onChange={(lines) => setLists((prev) => ({ ...prev, [key]: lines }))}
              newLine={newLine}
              showErrors={submitted}
            />
          ))}

          <Card aria-labelledby="intro-title" className={styles.listCard}>
            <div className={styles.between}>
              <h2 id="intro-title" className={styles.cardTitle}>
                회사 소개·인재상 <span className={styles.optional}>(선택)</span>
              </h2>
              <span className={styles.meta}>지원동기 작성에 써요</span>
            </div>
            {/* 디자인처럼 설명 문장 자체를 입력칸의 라벨로 쓴다 */}
            <label htmlFor="intro" className={styles.cardDesc}>
              회사가 하는 일, 팀 소개, 인재상처럼 지원동기에 참고할 내용을 자유롭게 적어 주세요.
            </label>
            <Textarea
              id="intro"
              rows={4}
              value={intro}
              onChange={(event) => setIntro(event.target.value)}
              placeholder="예: 온라인 결제와 정산 서비스를 만드는 핀테크 회사. 인재상: 데이터로 판단하는 사람"
            />
          </Card>
        </div>

        <aside className={styles.side} aria-label="작성 가이드">
          {guide}
          <Card size="sm" aria-labelledby="sum-title" className={styles.sideCard}>
            <h2 id="sum-title" className={styles.sideTitle}>
              입력 현황
            </h2>
            <dl className={styles.status}>
              <dt>필수사항</dt>
              <dd>{counts.required}개</dd>
              <dt>우대사항</dt>
              <dd>{counts.preferred}개</dd>
              <dt>주요 업무</dt>
              <dd>{counts.duties}개</dd>
            </dl>
            {/* 실제 임시 저장은 ④ 에서 붙인다 (C-02 S07 확인할 것 1·2번) */}
            <p className={styles.meta}>입력한 내용은 자동으로 임시 저장돼요.</p>
          </Card>
        </aside>
      </div>

      <div className={styles.actions}>
        {/* 공고 목록(S10)에서 "새 공고"로 들어오므로 그곳으로 돌아간다. 디자인은 library.html (C-02 S07에 기록) */}
        <ButtonLink href={routes.applyList}>취소</ButtonLink>
        <div className={styles.submit}>
          <span className={styles.meta}>
            {isValid
              ? `필수사항 ${counts.required}개, 우대사항 ${counts.preferred}개로 분석해요.`
              : "회사명, 포지션, 필수사항 1개 이상이 필요해요."}
          </span>
          <Button variant="primary" onClick={analyze}>
            적합도 분석하기 <Icon name="arrow" />
          </Button>
        </div>
      </div>
    </div>
  );
}
