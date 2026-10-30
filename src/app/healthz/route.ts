// 상태 확인 전용 주소 (#11). 쿠버네티스가 웹 서버가 살아 있는지 확인(probe)할 때 부른다.
// 화면을 그리지 않고 BE 도 부르지 않는다. 추적 기록도 남기지 않는다 (instrumentation.node.ts UNTRACED)
export function GET() {
  return new Response("ok");
}
