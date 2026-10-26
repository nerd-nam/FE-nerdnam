import type { NextConfig } from "next";
import { API_ORIGIN, USE_PRISM } from "./src/shared/api/origin";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,

  // 화면을 그리기 전에 다른 주소로 보내는 규칙
  async redirects() {
    return [
      // 프로젝트 주소에는 번호가 필요하다(/projects/[projectId]). 번호 없이 오면 프로젝트 목록이 있는 S06으로 (기획서 v1.11)
      // permanent: false → 나중에 규칙이 바뀔 수 있으니 브라우저가 기억하지 않는 임시 이동(307)으로 둔다
      { source: "/projects", destination: "/library", permanent: false },
    ];
  },

  // 브라우저가 우리 주소(/api/…)로 보낸 요청을 Next.js 가 BE 로 대신 전달한다 (④ 결정, 2026-10-26).
  // 브라우저는 같은 주소에만 요청하므로 CORS 설정이 필요 없고, 로그인 쿠키도 그대로 따라간다.
  // 주소창은 바뀌지 않는다(redirects 와 다름). 위에서부터 먼저 맞는 규칙을 쓴다.
  async rewrites() {
    return [
      // 가짜 서버(Prism)는 로그인·로그아웃·CSRF 토큰·AI 작업 끝남을 흉내 내지 못해서, 그것만 우리 개발용 대역(app/dev-api)이 맡는다
      ...(USE_PRISM
        ? [
            { source: "/oauth2/authorization/:provider", destination: "/dev-api/login" },
            { source: "/api/auth/logout", destination: "/dev-api/logout" },
            { source: "/api/auth/csrf", destination: "/dev-api/csrf" },
            { source: "/api/ai-jobs/:jobId", destination: "/dev-api/ai-jobs/:jobId" },
          ]
        : [{ source: "/oauth2/:path*", destination: `${API_ORIGIN}/oauth2/:path*` }]),
      { source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` },
    ];
  },
};

export default nextConfig;
