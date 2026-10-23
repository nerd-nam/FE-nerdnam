// 기간(월) 입력의 규칙. S03 재직기간과 S04 프로젝트 기간이 같이 쓴다.
// 값은 데이터와 같은 "YYYY-MM" 이고, 화면에는 "YYYY.MM" 으로 보여 준다 (기획서 4.2 start/end).
// 아직 다 적지 않은 값(예: "2023.0")은 그대로 들고 있다가 아래 규칙에서 형식 오류로 잡는다.

export const PERIOD_MESSAGES = {
  format: "2023.03처럼 연도 4자리와 월 2자리로 적어 주세요.",
  future: "이번 달까지만 입력할 수 있어요.",
  order: "종료 월이 시작 월보다 빨라요.",
  startRequired: "시작 월을 입력해 주세요.",
  endRequired: "종료 월을 입력해 주세요.",
};

// 완성된 월 값인지 ("2023-03"). 월은 01~12
export function isMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

// 이번 달 ("2026-10"). 미래 월을 막는 데 쓴다
export function thisMonth(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// 칸 하나의 오류. 비어 있는 것은 여기서 오류로 보지 않는다 (필수인지는 쓰는 곳이 정한다)
export function monthError(value: string): string | null {
  if (!value) return null;
  if (!isMonth(value)) return PERIOD_MESSAGES.format;
  if (value > thisMonth()) return PERIOD_MESSAGES.future;
  return null;
}

// 두 칸을 함께 본 오류: 종료가 시작보다 빠르면. "YYYY-MM" 은 글자 순서가 곧 시간 순서라 그대로 비교할 수 있다
export function orderError(start: string, end: string | null): string | null {
  if (!end || !isMonth(start) || !isMonth(end)) return null;
  return end < start ? PERIOD_MESSAGES.order : null;
}

// 입력한 글자를 "YYYY.MM" 모양으로 다듬는다. 숫자만 남기고 연도 4자리 뒤에 점을 넣는다
//   "202303" → "2023.03", "2023-3" → "2023.3", "2023." → "2023."
export function formatTyped(text: string) {
  const digits = text.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 4) return digits.length === 4 && /[.\-/]$/.test(text) ? `${digits}.` : digits;
  return `${digits.slice(0, 4)}.${digits.slice(4)}`;
}

// 화면 글자("2023.03") → 저장 값("2023-03"). 다 적지 않았으면 글자 그대로 들고 있는다
// 월이 한 자리("2023.1")일 때는 바로 바꾸지 않는다. 12월을 치는 중일 수 있어서다 → 칸을 떠날 때 padMonth 로 채운다
export function toValue(text: string) {
  const m = /^(\d{4})\.(\d{2})$/.exec(text);
  return m ? `${m[1]}-${m[2]}` : text;
}

// 칸을 떠날 때: 월이 한 자리면 두 자리로 채운다 ("2023.3" → "2023-03")
export function padMonth(text: string) {
  const m = /^(\d{4})\.([1-9])$/.exec(text);
  return m ? `${m[1]}-0${m[2]}` : toValue(text);
}

// 저장 값 → 화면 글자. 완성된 값만 바꾸고, 다 적지 않은 값은 그대로 보여 준다
export function toText(value: string) {
  return isMonth(value) ? value.replace("-", ".") : value;
}
