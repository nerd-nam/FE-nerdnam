import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { NodeSDK } from "@opentelemetry/sdk-node";

// 웹 서버(Node.js)에서 BE 로 요청을 보내는 길은 둘이고, 쓰는 함수가 다르다. 둘 다 감싸야 모든 요청에 traceparent 가 붙는다.
//   ① 서버에서 데이터 가져오기(shared/api/server.ts, openapi-fetch) → fetch (Node 안에서는 undici)
//   ② 대신 전달(next.config.ts rewrites, 브라우저의 /api/… 요청) → Next.js 가 http 모듈로 보낸다
// 보낼 곳·샘플링·서비스 이름은 코드에 고정하지 않는다. NodeSDK 가 INFRA 가 넣어 준 OTEL_* 환경 변수를 읽는다.
const sdk = new NodeSDK({
  instrumentations: [
    // ② 를 감싼다. 웹 서버로 들어오는 요청도 여기서 기록이 시작되는데, 정적 파일·이미지 요청은 뺀다
    new HttpInstrumentation({ ignoreIncomingRequestHook: (request) => isStaticFile(request.url ?? "") }),
    // ① 을 감싼다
    new UndiciInstrumentation(),
  ],
});
sdk.start();

// 화면 데이터와 상관없는 파일 요청 (빌드된 JS·CSS, 이미지 최적화, public/ 파일)
function isStaticFile(url: string) {
  return url.startsWith("/_next/static/") || url.startsWith("/_next/image") || url === "/favicon.ico";
}
