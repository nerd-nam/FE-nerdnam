import styles from "./Layout.module.css";

// 바닥글. 디자인에서는 S01 시작 화면에만 있다.
// TODO: 개인정보 처리방침·이용약관 화면이 생기면 주소를 연결한다 (C-02 S01 확인할 것 4). 지금은 디자인과 같은 자리표시.
// "개인정보 처리방침"(#privacy)은 S01 시작하기 카드의 개인정보 안내로 간다. "이용약관"(#terms)은 아직 갈 곳이 없다.
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span>© nerdnam</span>
        <a href="#privacy">개인정보 처리방침</a>
        <a href="#terms">이용약관</a>
      </div>
    </footer>
  );
}
