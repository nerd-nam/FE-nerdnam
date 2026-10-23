// S07 목록 입력(필수사항·우대사항·주요 업무)의 규칙. 화면 없이 글자만 다루는 함수들이다.
// 검증 메시지는 기획서 F4 "S07 입력 검증과 메시지" 표의 문구를 그대로 쓴다.
// 서버(BE-11)도 같은 규칙으로 한 번 더 검증한다 (C-02 S07 확인할 것 3번).

export const MAX_LINE = 150;

// 화면에서 다루는 한 줄. id 는 React 가 줄을 구별하고(key), 오류 메시지를 그 줄에 연결하는 데 쓴다
export type Line = { id: string; text: string };

export const MESSAGES = {
  company: "회사명을 입력해 주세요.",
  position: "포지션을 입력해 주세요.",
  requiredEmpty: "필수사항을 1개 이상 입력해 주세요.",
  tooLong: `한 줄이 너무 길어요. 요건이 여러 개라면 줄을 나눠 주세요. (${MAX_LINE}자 이하)`,
  duplicate: "같은 내용이 이미 있어요.",
};

// 앞의 목록 기호를 지운다: "- ", "• ", "· ", "* ", "1. ", "2) " …
export function cleanLine(line: string) {
  return line.replace(/^\s*([-•·*▪◦]|\d+[.)])\s*/, "").trim();
}

// 여러 줄을 붙여넣었을 때 줄마다 나눈다. 빈 줄은 버린다
export function splitPasted(text: string) {
  return text.split(/\r?\n/).map(cleanLine).filter(Boolean);
}

// 빈 줄은 오류로 보지 않고 저장할 때 무시한다 (기획서 F4)
export function filledLines(lines: Line[]) {
  return lines.filter((line) => line.text.trim() !== "");
}

// 한 줄의 오류 메시지. 없으면 null
// 같은 내용이 여러 줄이면 맨 처음 줄은 그대로 두고, 그 뒤에 나온 줄에만 "이미 있어요"를 붙인다
export function lineError(lines: Line[], line: Line): string | null {
  const text = line.text.trim();
  if (!text) return null;
  if (text.length > MAX_LINE) return MESSAGES.tooLong;
  const first = lines.find((other) => other.text.trim() === text);
  if (first && first.id !== line.id) return MESSAGES.duplicate;
  return null;
}
