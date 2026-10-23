import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsentCard } from "@/features/start/ConsentCard";
import styles from "@/features/start/Start.module.css";
import { Footer } from "@/shared/layout/Footer";
import { Header } from "@/shared/layout/Header";
import { Page } from "@/shared/layout/Page";
import { safeNext } from "@/shared/routes";

export const metadata: Metadata = { title: "약관 동의" };

// 지금 약관 버전. 실제로는 403 CONSENT_REQUIRED 응답이나 GET /api/me 의 termsVersion 을 쓴다 (④)
const MOCK_TERMS_VERSION = "2026-11";

// S01-2 약관 동의 (주소: /consent?next=/library) · 디자인 design/consent.html
// 동의 전에는 다른 화면을 쓸 수 없으므로 머리글은 로고만 둔다.
// next(돌아갈 화면)는 우리 사이트 안 주소만 받는다 (safeNext). 주소 값이라 Suspense 로 감싼다.
export default function ConsentPage({ searchParams }: PageProps<"/consent">) {
  return (
    <>
      <Header variant="plain" />
      <Page grow>
        <div className={styles.consentPage}>
          <Suspense>
            {searchParams.then((sp) => (
              <ConsentCard termsVersion={MOCK_TERMS_VERSION} next={safeNext(typeof sp.next === "string" ? sp.next : undefined)} />
            ))}
          </Suspense>
        </div>
      </Page>
      <Footer />
    </>
  );
}
