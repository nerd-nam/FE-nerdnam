// 서버가 준 값으로 만드는 React key. 값이 바뀌면 key 도 바뀌어 화면 부품을 새로 만든다.
//
// 왜 필요한가: Next.js(cacheComponents)는 떠난 화면을 지우지 않고 숨겨 두었다가 다시 오면 그대로 보여 준다.
// 화면 부품은 처음 받은 값으로 useState 를 시작하므로, 서버가 새 데이터를 보내도 예전 값을 계속 보여 준다.
// 이 key 를 달면: 데이터가 같으면 지금 상태(아직 저장하지 않은 입력 등)를 그대로 두고, 바뀌었으면 새 데이터로 다시 시작한다.
//
// 쓰는 법 (서버 컴포넌트 page.tsx 에서): <PostingList key={dataKey(postings)} initialPostings={postings} />
export function dataKey(value: unknown): string {
  const text = JSON.stringify(value) ?? "";
  // 긴 글을 짧은 key 로 줄인다 (FNV-1a 해시)
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return (hash >>> 0).toString(36);
}
