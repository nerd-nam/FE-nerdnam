import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FinishLogin } from "@/features/start/FinishLogin";
import { nextStepPath } from "@/features/start/onboarding";
import { StartCard } from "@/features/start/StartCard";
import styles from "@/features/start/Start.module.css";
import { data, serverApi } from "@/shared/api/server";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { Page } from "@/shared/layout/Page";
import { routes } from "@/shared/routes";
import { Icon } from "@/shared/ui/Icon";

// S01 시작하기 (주소: /) · 작업: FE-04 (① 모양 · ② 나누기 · ③ 움직임 · ④ 로그인 연결)
// 왼쪽 소개·흐름은 움직이지 않아서 여기(서버)서 그리고, 동의에 따라 버튼이 바뀌는 시작하기 카드만 클라이언트 컴포넌트다.
// 제목(<h1>)이 디자인처럼 큰 글씨라 공용 PageHead 대신 직접 만든다.
//
// 로그인 흐름 (C-02 S01): 소셜 로그인이 끝나면 BE 가 여기(/)로 돌려보낸다. 그래서 열릴 때 서버에서 로그인 상태를 본다(StartGate).
// - 로그인 안 함 → 시작하기 카드 (실패해서 돌아왔으면 /?login=failed → 오류 안내)
// - 로그인 + 동의 기록 있음 → 갈 화면으로 (GET /api/me/onboarding, onboarding.ts)
// - 로그인 + 동의 기록 없음 → 로그인 마무리(FinishLogin): S01 에서 받은 동의를 기록하거나 약관 동의 화면으로

// 서비스 흐름 3단계 (디자인 index.html)
const STEPS = [
  { title: "내 경험 정리", desc: "프로젝트를 [문제]-[해결]-[결과]로 다듬고, 내가 확인한 내용만 저장해요.", meta: "처음 한 번 · 약 15분" },
  { title: "공고 입력", desc: "필수사항과 우대사항을 한 줄에 하나씩 옮겨 적어요. 요건마다 내 경험을 맞춰 봐요.", meta: "공고마다" },
  { title: "작성 방향 받기", desc: "요건별 근거 경험, 서류 4종의 방향, 포트폴리오 이미지 프롬프트까지.", meta: "약 1분" },
];

export default function StartPage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <Header variant="start" />
      <Page grow>
        <div className={styles.split}>
          <section className={styles.intro} aria-labelledby="hero-title">
            <div className={styles.heroText}>
              <p className={styles.eyebrow}>개발자를 위한 지원서 코치</p>
              <h1 id="hero-title" className={styles.heroTitle}>
                경험은 한 번 정리하고,
                <br />
                방향은 공고마다.
              </h1>
              <p className={styles.heroDesc}>
                기술스택·경력·프로젝트를 한 번 정리해 두면, 채용공고의 필수·우대사항마다 근거가 되는 내 경험을 찾아 지원동기부터
                경력기술서까지 쓸 방향을 잡아 드려요.
              </p>
            </div>

            <ol className={styles.steps} aria-label="서비스 흐름">
              {STEPS.map((step, index) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNum}>{String(index + 1).padStart(2, "0")}</span>
                  <strong className={styles.stepTitle}>{step.title}</strong>
                  <span className={styles.stepDesc}>{step.desc}</span>
                  <span className={styles.stepMeta}>{step.meta}</span>
                </li>
              ))}
            </ol>

            <p className={styles.promise}>
              <Icon name="shield" />
              없는 경험은 만들지 않아요. 모든 제안에 내 경험의 출처가 붙어요.
            </p>
          </section>

          {/* 로그인 상태를 묻는 동안은 시작하기 카드를 먼저 보여 준다 */}
          <Suspense fallback={<StartCard />}>
            {searchParams.then((sp) => (
              <StartGate loginFailed={sp.login === "failed"} />
            ))}
          </Suspense>
        </div>
      </Page>
      <Footer />
    </>
  );
}

async function StartGate({ loginFailed }: { loginFailed: boolean }) {
  const api = await serverApi(routes.start, { anonymous: true });
  const me = await api.GET("/api/me");
  if (me.response.status === 401) return <StartCard loginFailed={loginFailed} />;
  if (data(me).consentRequired) return <FinishLogin />;
  redirect(nextStepPath(data(await api.GET("/api/me/onboarding"))));
}
