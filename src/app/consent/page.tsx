import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ConsentCard } from "@/features/start/ConsentCard";
import styles from "@/features/start/Start.module.css";
import { data, serverApi } from "@/shared/api/server";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { Page } from "@/shared/layout/Page";
import { routes, safeNext } from "@/shared/routes";

export const metadata: Metadata = { title: "약관 동의" };

// S01-2 약관 동의 (주소: /consent?next=/library) · 디자인 design/consent.html
// 동의 전에는 다른 화면을 쓸 수 없으므로 머리글은 로고만 둔다.
// next(돌아갈 화면)는 우리 사이트 안 주소만 받는다 (safeNext). 주소 값이라 Suspense 로 감싼다.
// 약관 버전은 서버에서 가져온다(GET /api/me 의 termsVersion). 로그인 안 했으면 S01, 이미 동의했으면 바로 next 로.
export default function ConsentPage({ searchParams }: PageProps<"/consent">) {
  return (
    <>
      <Header variant="plain" />
      <Page grow>
        <div className={styles.consentPage}>
          <Suspense>
            {searchParams.then((sp) => (
              <Consent next={safeNext(typeof sp.next === "string" ? sp.next : undefined)} />
            ))}
          </Suspense>
        </div>
      </Page>
      <Footer />
    </>
  );
}

async function Consent({ next }: { next: string }) {
  const api = await serverApi(routes.consent(next));
  const me = data(await api.GET("/api/me"));
  if (!me.consentRequired) redirect(next);
  return <ConsentCard termsVersion={me.termsVersion} next={next} />;
}
