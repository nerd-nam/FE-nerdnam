import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FinishLogin } from "@/features/start/FinishLogin";
import { RETURN_COOKIE } from "@/features/start/loginReturn";
import { nextStepPath } from "@/features/start/onboarding";
import { StartCard } from "@/features/start/StartCard";
import styles from "@/features/start/Start.module.css";
import { data, serverApi } from "@/shared/api/server";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { Page } from "@/shared/layout/Page";
import { isSafePath, routes } from "@/shared/routes";
import { Icon } from "@/shared/ui/Icon";

// S01 시작하기 (주소: /) · 작업: FE-04 (① 모양 · ② 나누기 · ③ 움직임 · ④ 로그인 연결)
// 왼쪽 소개·흐름은 움직이지 않아서 여기(서버)서 그리고, 동의에 따라 버튼이 바뀌는 시작하기 카드만 클라이언트 컴포넌트다.
// 제목(<h1>)이 디자인처럼 큰 글씨라 공용 PageHead 대신 직접 만든다.
//
// 로그인 흐름 (C-02 S01): 소셜 로그인이 끝나면 BE 가 여기(/)로 돌려보낸다. 그래서 열릴 때 서버에서 로그인 상태를 본다(startCard).
// - 로그인 안 함 → 시작하기 카드 (실패해서 돌아왔으면 /?login=failed → 오류 안내)
// - 로그인 + 동의 기록 있음 → 갈 화면으로: 로그인이 풀려서 왔던 화면(loginReturn.ts)이 있으면 거기, 없으면 하던 단계 (GET /api/me/onboarding, onboarding.ts)
// - 로그인 + 동의 기록 없음 → 로그인 마무리(FinishLogin): S01 에서 받은 동의를 기록하거나 약관 동의 화면으로

// 서비스 흐름 3단계 (디자인 index.html)
const STEPS = [
  { title: "내 경험 정리", desc: "프로젝트를 [문제]-[해결]-[결과]로 다듬고, 내가 확인한 내용만 저장해요.", meta: "처음 한 번 · 약 15분" },
  { title: "공고 입력", desc: "필수사항과 우대사항을 한 줄에 하나씩 옮겨 적어요. 요건마다 내 경험을 맞춰 봐요.", meta: "공고마다" },
  { title: "작성 방향 받기", desc: "요건별 근거 경험, 서류 4종의 방향, 포트폴리오 이미지 프롬프트까지.", meta: "약 1분" },
];

// 로그인 확인을 먼저 끝낸 뒤 그린다 (기획서 v1.62). 시작 화면을 먼저 보여 주면 로그인한 사용자는 시작 화면이 잠깐 보였다가
// 하던 화면으로 다시 이동해 깜빡인다. 로그인 쿠키를 읽는 부분은 Suspense 안에 있어야 해서(cacheComponents) 화면 전체를 감싸고,
// 확인하는 동안은 아무것도 보여 주지 않는다
export default function StartPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense>
      <Start searchParams={searchParams} />
    </Suspense>
  );
}

async function Start({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const sp = await searchParams;
  // 로그인했으면 여기서 다른 화면으로 이동해서 아래는 그리지 않는다
  const card = await startCard({ loginFailed: sp.login === "failed", next: typeof sp.next === "string" && isSafePath(sp.next) ? sp.next : undefined });

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

          {card}
        </div>
      </Page>
      <Footer />
    </>
  );
}

// 로그인 상태에 따라 오른쪽 카드를 고르거나, 로그인했으면 갈 화면으로 보낸다
// next: 로그인이 풀려서 왔을 때(/?next=…) 돌아갈 화면 (우리 사이트 안 주소만)
async function startCard({ loginFailed, next }: { loginFailed: boolean; next?: string }) {
  const api = await serverApi(routes.start, { anonymous: true });
  const me = await api.GET("/api/me");
  if (me.response.status === 401) return <StartCard loginFailed={loginFailed} next={next} />;
  if (data(me).consentRequired) return <FinishLogin />;
  // 갈 곳: ① 소셜 로그인을 다녀오기 전에 적어 둔 화면(쿠키, 지우는 일은 /after-login 이 함) ② 주소의 next ③ 하던 단계
  if ((await cookies()).has(RETURN_COOKIE)) redirect(AFTER_LOGIN);
  if (next) redirect(next);
  redirect(nextStepPath(data(await api.GET("/api/me/onboarding"))));
}

const AFTER_LOGIN = "/after-login"; // app/after-login/route.ts
