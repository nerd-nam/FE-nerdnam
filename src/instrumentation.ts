// 분산 추적 (#10): 웹 서버가 켜질 때 한 번, 앱 코드보다 먼저 실행된다 (Next.js 규칙 — src/ 바로 아래에 둔다).
// 배포 환경(EKS)에서 INFRA 가 OTEL_* 환경 변수를 넣어 줄 때만 켠다. 로컬 개발(npm run dev)·팀원 Docker 테스트에는 영향이 없다.
// 웹 서버에서 BE 로 나가는 요청만 계측한다. 브라우저(RUM)는 범위 밖이다.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    await import("./instrumentation.node");
  }
}
