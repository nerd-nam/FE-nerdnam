import Link from "next/link";
import { evidenceHref } from "@/shared/evidence";
import type { GuideTab } from "@/shared/routes";
import { Tag } from "@/shared/ui/Badge";
import { Callout } from "@/shared/ui/Callout";
import { Card, CardDesc } from "@/shared/ui/Card";
import { CopyButton } from "@/shared/ui/CopyButton";
import { Icon } from "@/shared/ui/Icon";
import { Table } from "@/shared/ui/Table";
import type { CareerPreview, CoverageRow, Guide, GuideDoc, RewriteRow } from "./mock";
import styles from "./Guide.module.css";

// S09 탭 하나의 내용 (원본: design/assets/js/guide.js 의 render)
// 네 탭 공통: 핵심 메시지 → 문단 구성 → (탭 전용 블록) → 강조할 키워드·피해야 할 것
// 움직이는 부분은 "구성 복사" 버튼뿐이라 그것만 클라이언트 컴포넌트(CopyButton)다.
export function GuidePanel({ tab, guide }: { tab: GuideTab; guide: Guide }) {
  if (tab === "image") {
    return (
      <Callout tone="sunken" icon="info">
        이미지 프롬프트 탭은 FE-15 에서 만들 예정이에요.
      </Callout>
    );
  }

  const doc = guide.docs[tab];
  return (
    <>
      <MessageBlock doc={doc} />
      <OutlineBlock doc={doc} />
      {tab === "intro" && <CoverageBlock rows={guide.docs.intro.coverage} />}
      {tab === "portfolio" && (
        // 포트폴리오 페이지 흐름(쪽마다 와이어프레임)은 FE-14
        <Callout tone="sunken" icon="info">
          포트폴리오 페이지 흐름은 FE-14 에서 만들 예정이에요.
        </Callout>
      )}
      {tab === "career" && (
        <>
          <RewriteBlock rows={guide.docs.career.rewrites} />
          <PreviewBlock preview={guide.docs.career.preview} />
        </>
      )}
      <KeywordAvoidBlock doc={doc} />
    </>
  );
}

function MessageBlock({ doc }: { doc: GuideDoc }) {
  return (
    <Card tone="dark" className={styles.message}>
      <span className={styles.messageLabel}>핵심 메시지</span>
      <p className={styles.messageText}>“{doc.message}”</p>
    </Card>
  );
}

// "구성 복사"로 넣을 글: 핵심 메시지 + 번호 붙인 문단 (디자인 guide.js 의 docText 와 같은 형식)
function docText(doc: GuideDoc) {
  return [`핵심 메시지: ${doc.message}`, ...doc.outline.map((item, i) => `${i + 1}. ${item.title} — ${item.desc}`)].join("\n");
}

function OutlineBlock({ doc }: { doc: GuideDoc }) {
  return (
    <Card aria-labelledby="outline-title" className={styles.outline}>
      <div className={styles.between}>
        <h2 id="outline-title" className={styles.cardTitle}>
          {doc.outlineTitle}
        </h2>
        <CopyButton text={docText(doc)} label="구성 복사" />
      </div>
      <ol className={styles.outlineList}>
        {doc.outline.map((item, i) => (
          <li key={item.title} className={styles.outlineItem}>
            <span className={styles.num}>{i + 1}</span>
            <div className={styles.outlineBody}>
              <strong className={styles.outlineTitle}>{item.title}</strong>
              <p className={styles.outlineDesc}>{item.desc}</p>
              {item.sources.length > 0 && (
                <div className={styles.sources}>
                  {item.sources.map((source) => (
                    <Link key={source.label} href={evidenceHref(source)} className={styles.src}>
                      <Icon name="link" size="sm" />
                      근거 · {source.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function CoverageBlock({ rows }: { rows: CoverageRow[] }) {
  return (
    <Card aria-labelledby="coverage-title">
      <div className={styles.titleStack}>
        <h2 id="coverage-title" className={styles.cardTitle}>
          요건 커버리지
        </h2>
        <CardDesc>자기소개의 어느 문단이 공고의 어떤 요건을 다루는지 보여 줘요.</CardDesc>
      </div>
      <Table variant="boxed">
        <thead>
          <tr>
            <th scope="col">요건</th>
            <th scope="col">구분</th>
            <th scope="col">다루는 곳</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.text}>
              <td className={styles.strong}>{row.text}</td>
              <td className={styles.kindCell}>{row.type === "required" ? "필수" : "우대"}</td>
              <td>
                {/* 다뤘는지는 색과 함께 아이콘(✓ / –)으로도 구분한다 */}
                <span className={row.covered ? styles.covered : styles.notCovered}>
                  <Icon name={row.covered ? "check" : "dash"} size="sm" bold={row.covered} />
                  {row.where}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

function RewriteBlock({ rows }: { rows: RewriteRow[] }) {
  return (
    <Card aria-labelledby="rewrite-title">
      <div className={styles.titleStack}>
        <h2 id="rewrite-title" className={styles.cardTitle}>
          공고 용어로 바꿔 쓰기
        </h2>
        <CardDesc>입력한 주요 업무를 공고의 요건 표현에 맞춰 다시 쓴 제안이에요.</CardDesc>
      </div>
      <Table variant="boxed" className={styles.rewriteTable}>
        <thead>
          <tr>
            <th scope="col">지금 표현</th>
            <th aria-hidden="true" className={styles.arrowCell} />
            <th scope="col">바꾼 표현</th>
            <th scope="col">맞춘 요건</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.from}>
              <td className={styles.muted}>{row.from}</td>
              <td aria-hidden="true" className={styles.arrowCell}>
                <Icon name="arrow" size="sm" />
              </td>
              <td className={styles.strong}>{row.to}</td>
              <td>
                <Tag variant="accent">{row.requirement}</Tag>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

function PreviewBlock({ preview }: { preview: CareerPreview }) {
  return (
    <Card aria-labelledby="preview-title">
      <div className={styles.between}>
        <h2 id="preview-title" className={styles.cardTitle}>
          미리보기
        </h2>
        <span className={styles.meta}>예시예요. 문장은 직접 다듬으세요.</span>
      </div>
      {/* 종이 한 장처럼 보이게 (style.css .paper) */}
      <div className={styles.paper}>
        <div className={styles.paperHead}>
          <span className={styles.paperCompany}>
            {preview.company} <span className={styles.paperTeam}>{preview.team}</span>
          </span>
          <span className={styles.paperPeriod}>{preview.period}</span>
        </div>
        <ul className={styles.paperList}>
          {preview.items.map((item) => (
            <li key={item.title}>
              <strong className={styles.paperItem}>{item.title}</strong>
              <div className={styles.paperDetail}>– {item.detail}</div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function KeywordAvoidBlock({ doc }: { doc: GuideDoc }) {
  return (
    <div className={styles.grid2}>
      <Card size="sm" aria-labelledby="keyword-title">
        <h2 id="keyword-title" className={styles.smallTitle}>
          강조할 키워드
        </h2>
        <div className={styles.keywords}>
          {doc.keywords.map((keyword) => (
            <span key={keyword} className={styles.keyword}>
              {keyword}
            </span>
          ))}
        </div>
      </Card>
      <Card tone="bad" size="sm" aria-labelledby="avoid-title">
        <h2 id="avoid-title" className={styles.avoidTitle}>
          피해야 할 것
        </h2>
        <ul className={styles.avoidList}>
          {doc.avoid.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
