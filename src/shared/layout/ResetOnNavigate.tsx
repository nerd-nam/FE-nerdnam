"use client";

// 링크·버튼으로 들어오면 안의 화면 부품을 새로 만든다. 뒤로 가기·앞으로 가기로 돌아오면 그대로 둔다.
// Next.js(cacheComponents)는 떠난 화면을 숨겨 두었다가 같은 주소로 다시 오면 그대로 꺼내 보여 준다.
// S04·S07 의 새 양식(/projects/new, /apply/new/jd)은 처음 저장하면 주소만 번호로 바꾸고 그 프로젝트·공고가 되므로,
// 숨겨 둔 화면을 꺼내면 "새 프로젝트"를 눌렀는데 방금 쓴 프로젝트가 나온다. 서버 데이터는 늘 빈 양식이라
// 데이터로 만든 key(shared/dataKey)로는 구분할 수 없어서, Next.js 가 주는 이동 번호(bfcacheId)를 key 로 쓴다.
// bfcacheId: 링크·router.push·replace 로 오면 바뀌고, 뒤로·앞으로 가기·router.refresh 에서는 그대로다.
// 단, router.refresh 는 Next.js 의 뒤로 가기 보관함을 비운다. 뒤로 가기 때마다 RefreshOnHistory 가 refresh 하므로
// 이 안의 양식은 사실상 뒤로·앞으로 가기에서도 새로 만들어진다(저장하지 않은 입력은 남지 않음). cacheComponents 전과 같은 동작이다.
// 링크로 떠날 때는 useSaveOnLeave 가 먼저 저장하므로 잃지 않는다.
import { useRouter } from "next/navigation";
import { Fragment, type ReactNode } from "react";

export function ResetOnNavigate({ children }: { children: ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
