"use client";

// S09 "PDF로 내보내기" · 작업: FE-15. 방식은 브라우저 인쇄 (D-6 결정, 기획서 v1.25).
// 누르면 브라우저 인쇄 창이 열리고, 사용자가 "PDF로 저장"을 고른다. 서버는 부르지 않는다.
// 인쇄되는 것은 지금 보고 있는 탭이다. 머리글·버튼·오른쪽 칸은 globals.css 의 .print-hide 로 빠진다.
import { Button } from "@/shared/ui/Button";

export function PrintButton() {
  return <Button onClick={() => window.print()}>PDF로 내보내기</Button>;
}
