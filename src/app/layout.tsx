import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

// 디자인 글꼴. 빌드 시 내려받아 우리 서버에서 제공한다(사용자 브라우저가 Google에 직접 요청하지 않음).
// 한글 글자는 subset 목록에 없어서 preload 를 끄고, 화면에 필요한 글자만 그때그때 불러오게 한다.
const plexSans = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "nerdnam · AI 맞춤형 지원서 코치",
    template: "%s · nerdnam",
  },
  description: "내 경험을 한 번 정리해 두면, 공고마다 지원서 작성 방향을 잡아 주는 AI 지원서 코치",
};

// 루트 레이아웃: 모든 화면을 감싸는 가장 바깥 틀. <html>, <body> 는 여기에만 둔다.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={plexSans.variable}>
      <body>{children}</body>
    </html>
  );
}
