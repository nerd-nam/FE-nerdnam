// 서버 시각(ISO 8601, 예: "2026-10-23T06:00:00Z")을 화면 날짜 "2026.10.23" 으로 바꾼다.
// 서버 시각은 세계 표준시(Z)라서 한국 시간으로 바꿔서 날짜를 정한다 (밤 9시 이후 저장한 것이 하루 앞당겨 보이지 않게).
const DATE_PARTS = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });

export function formatDate(iso: string) {
  const parts = Object.fromEntries(DATE_PARTS.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.year}.${parts.month}.${parts.day}`;
}
