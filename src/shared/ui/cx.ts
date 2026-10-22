// 클래스 이름 여러 개를 한 줄로 합친다. false·undefined 는 빠진다.
// 예: cx(styles.btn, isPrimary && styles.primary) → "Button_btn__a1 Button_primary__b2"
export function cx(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ");
}
