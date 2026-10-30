import { type Attributes, type Context, SpanKind } from "@opentelemetry/api";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { NodeSDK, tracing } from "@opentelemetry/sdk-node";
import type { ClientRequest } from "node:http";

// 웹 서버(Node.js)에서 BE 로 요청을 보내는 길은 둘이고, 쓰는 함수가 다르다. 둘 다 감싸야 모든 요청에 traceparent 가 붙는다.
//   ① 서버에서 데이터 가져오기(shared/api/server.ts, openapi-fetch) → fetch (Node 안에서는 undici)
//   ② 대신 전달(next.config.ts rewrites, 브라우저의 /api/… 요청) → Next.js 가 http 모듈로 보낸다
// 보낼 곳·서비스 이름은 코드에 고정하지 않는다. NodeSDK 가 INFRA 가 넣어 준 OTEL_* 환경 변수를 읽는다.

// Next.js 도 fetch 를 기록하지만 traceparent 는 붙이지 않는다(직접 확인, #11). 그래서 ① 은 undici 기록만 남기고 Next.js 쪽은 끈다.
// Next.js 는 요청을 보낼 때마다 이 값을 읽으므로 여기서 켜 두면 된다
process.env.NEXT_OTEL_FETCH_DISABLED = "1";

// 화면 데이터와 상관없는 요청 — 기록을 시작하지 않는다 (빌드된 JS·CSS, 이미지 최적화, 아이콘, 상태 확인)
const UNTRACED = ["/_next/static/", "/_next/image", "/favicon.ico", "/healthz"];

// 기록할지 정하는 문지기. 새로 시작하는 기록 중 위 경로와, 서버가 켜질 때 생기는 내부 기록('load route module' 등)은 남기지 않는다.
// 대신 전달은 Next.js 가 받은 요청을 기록하지 않아서 "BE 로 넘긴 요청"(CLIENT)이 첫 기록이 된다 → 버리지 않는다
// (버리면 BE 에도 "기록하지 마" 표시가 넘어가 BE 기록까지 사라진다).
// 비율은 OTEL_TRACES_SAMPLER_ARG 를 따른다(sampler 를 직접 주면 NodeSDK 가 OTEL_TRACES_SAMPLER 를 읽지 않는다)
class RequestSampler implements tracing.Sampler {
  #ratio = new tracing.TraceIdRatioBasedSampler(Number(process.env.OTEL_TRACES_SAMPLER_ARG ?? "1"));

  shouldSample(context: Context, traceId: string, _name: string, kind: SpanKind, attributes: Attributes) {
    // url.path: http 부품, http.target: Next.js (브라우저는 /favicon.ico?favicon.… 처럼 뒤에 붙여 부른다)
    const path = pathOf(String(attributes["url.path"] ?? attributes["http.target"] ?? ""));
    if (kind === SpanKind.INTERNAL || startsWithAny(path, UNTRACED)) return { decision: tracing.SamplingDecision.NOT_RECORD };
    return this.#ratio.shouldSample(context, traceId);
  }

  toString() {
    return "RequestSampler";
  }
}

const sdk = new NodeSDK({
  // 이어 받은 요청은 앞 기록의 결정을 따르고, 새로 시작하는 기록만 위 문지기가 정한다
  sampler: new tracing.ParentBasedSampler({ root: new RequestSampler() }),
  instrumentations: [
    // ② 를 감싼다. 받는 요청은 감싸지 않는다: 화면 요청은 Next.js 가 이미 기록하고,
    // 받는 요청 중 일부를 빼면 http 부품이 그 요청 안의 추적을 통째로 꺼 버린다(Next.js 기록·traceparent 까지, 직접 확인)
    new HttpInstrumentation({
      disableIncomingRequestInstrumentation: true,
      // 이름이 "GET" 만이면 무슨 요청인지 모른다 → 주소를 붙인다
      requestHook: (span, request) => span.updateName(`proxy ${request.method} ${pathOf((request as ClientRequest).path)}`),
    }),
    // ① 을 감싼다
    new UndiciInstrumentation({
      requestHook: (span, request) => span.updateName(`fetch ${request.method} ${pathOf(request.path)}`),
    }),
  ],
});
sdk.start();

// 주소에서 ? 뒤(검색어 등)를 뗀다
function pathOf(url: string) {
  return url.split("?")[0];
}

function startsWithAny(path: string, prefixes: string[]) {
  return prefixes.some((prefix) => path.startsWith(prefix));
}
