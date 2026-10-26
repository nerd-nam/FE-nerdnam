// BE 서버 주소. next.config.ts(대신 전달)와 서버에서 데이터를 가져오는 코드(server.ts)가 함께 쓴다.
// API_ORIGIN 환경 변수를 주면 그 서버로, 안 주면 가짜 서버 Prism(npm run mock:api, 4010번)으로 보낸다.
// 진짜 BE 로 바꿀 때: API_ORIGIN=http://localhost:8080 npm run dev
export const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4010";

// Prism 을 쓰는 중인지. Prism 은 계약의 예시 응답만 돌려주고 로그인·CSRF 토큰은 흉내 내지 못한다 (app/dev-api 참고)
export const USE_PRISM = !process.env.API_ORIGIN;
