// S07 에서 쓰는 임시 데이터.
// API(C-03 계약)와 공통 예시 데이터(fixtures/)가 나오면 이 파일 대신 서버에서 받아 온다.
// 내용은 design/assets/js/jd.js 의 #filled 예시를 따랐다.

// 공고 양식 (기획서 F4·4.5, C-02 S07 조회). 목록은 "한 줄에 하나"인 글자 목록이다.
export type JdDraft = {
  company: string;
  position: string;
  url: string; // 공고 링크 (선택, 나중에 다시 보기용)
  required: string[]; // 필수사항
  preferred: string[]; // 우대사항
  duties: string[]; // 주요 업무 (지원동기용, 판정에 쓰지 않음)
  intro: string; // 회사 소개·인재상 (지원동기용)
};

// 새 공고(/apply/new/jd)의 빈 양식. 목록마다 빈 줄 하나로 시작한다
export const EMPTY_JD: JdDraft = {
  company: "",
  position: "",
  url: "",
  required: [""],
  preferred: [""],
  duties: [""],
  intro: "",
};

// 저장된 공고 (/apply/j_201/jd). 번호(j_201)는 임시다. 서버가 정하는 번호는 "new" 가 될 수 없다 (기획서 4.5)
const JD_J201: JdDraft = {
  company: "OO페이",
  position: "백엔드 개발자 (결제 플랫폼)",
  url: "",
  required: ["Java/Spring 기반 개발 경력 3년 이상", "RDBMS 설계 및 쿼리 튜닝 경험", "대용량 트래픽 처리 경험"],
  preferred: ["Kafka 등 메시지 큐 운영 경험", "결제·금융 도메인 경험", "Kubernetes 운영 경험"],
  duties: ["결제 승인·정산 시스템 개발 및 운영", "대용량 트래픽 대응을 위한 아키텍처 개선"],
  intro: "온라인 결제와 정산 서비스를 만드는 핀테크 회사",
};

export const MOCK_JDS: Record<string, JdDraft> = {
  j_201: JD_J201,
  // S08 상태 화면(j_202 분석 중, j_203 분석 실패)의 "공고 수정"이 갈 곳. 내용은 간단히 채웠다
  j_202: { ...EMPTY_JD, company: "△△커머스", position: "서버 개발자", required: ["Java 또는 Kotlin 개발 경력 2년 이상"] },
  j_203: { ...EMPTY_JD, company: "□□랩", position: "백엔드 엔지니어", required: ["Spring 기반 API 개발 경험"] },
  // S09 탭 상태 화면 확인용 공고. 내용은 j_201 과 같다
  j_204: { ...JD_J201, company: "◇◇페이먼츠", position: "백엔드 개발자" },
};

// 저장된 공고 찾기. MOCK_JDS[id] 로 바로 꺼내면 id 가 "constructor" 같은 글자일 때 엉뚱한 값이 나와서 hasOwn 으로 확인한다
export function findJd(id: string): JdDraft | undefined {
  return Object.hasOwn(MOCK_JDS, id) ? MOCK_JDS[id] : undefined;
}

// 새 공고에서 "적합도 분석하기"를 누르면 갈 임시 리포트의 공고 번호.
// 실제로는 서버가 공고를 저장하면서 번호를 만들어 준다 (④, C-02 S07 확인할 것 1번)
export const MOCK_ANALYZED_JD_ID = "j_201";
