import Link from "next/link";
import type { ReactNode } from "react";
import { evidenceHref, type Evidence } from "@/shared/evidence";
import { cx } from "./cx";

// 근거 링크 (S08 근거, S09 근거 출처). 지워진 경험은 갈 곳이 없어 링크 없이 이름 뒤에 "(삭제된 경험)"을 붙인다 (C-02 S08 확인할 것 7)
type EvidenceLinkProps = { evidence: Evidence; className?: string; deletedClassName?: string; children: ReactNode };

export function EvidenceLink({ evidence, className, deletedClassName, children }: EvidenceLinkProps) {
  const href = evidenceHref(evidence);
  if (!href) {
    return (
      <span className={cx(className, deletedClassName)}>
        {children} (삭제된 경험)
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
