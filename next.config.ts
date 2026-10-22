import type { NextConfig } from "next";

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
};

export default nextConfig;
