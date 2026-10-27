"use client";

// "이 프로젝트에서 쓴 기술"(S04)·"이 회사에서 쓴 기술"(S03): 기술스택에서 고르고, 없는 기술은 바로 추가한다 (기획서 F1)
// 고른 기술은 ProjectEditor·CareerBoard 가 들고 있다(번호 목록). 새 기술 추가는 누르는 즉시 서버에 보낸다:
// 내 기술스택에 "학습 중"으로 만들고(POST /api/me/skills), 서버가 표준 이름으로 바꿔 준 결과를 칩으로 붙여 고른다.
// 카테고리는 고르지도 보내지도 않는다 (FE 결정 2026-10-27). 사전에 없는 기술은 서버가 etc(기타)로 등록한다 (C-03 v0.1.6).
// 프로젝트·경력과의 연결은 그것을 저장할 때(userSkillIds) 같이 간다 — 새 프로젝트·경력도 저장 전에 기술을 추가할 수 있게 (C-02 S04 확인할 것 5)
import Link from "next/link";
import { useState } from "react";
import { api } from "@/shared/api/client";
import { problemMessage } from "@/shared/api/problem";
import { routes } from "@/shared/routes";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { Input } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import styles from "./SkillPicker.module.css";

export type SkillOption = { id: number; name: string }; // 내 기술스택 (userSkillId, 이름)

type SkillPickerProps = {
  legend: string; // 예: "이 프로젝트에서 쓴 기술"
  options: SkillOption[]; // 고를 수 있는 기술 = 내 기술스택
  selected: number[];
  onToggle: (id: number) => void;
  onAdded: (skill: SkillOption) => void; // 새로 만든(또는 이미 있던) 기술: 칩 목록에 붙이고 고른다
};

export function SkillPicker({ legend, options, selected, onToggle, onAdded }: SkillPickerProps) {
  const [name, setName] = useState(""); // "기술스택에 없는 기술" 칸
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    // 이미 칩에 있는 이름이면(대소문자 무시) 서버에 묻지 않고 그 칩을 고른다
    const existing = options.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!selected.includes(existing.id)) onToggle(existing.id);
      setName("");
      return;
    }
    setPending(true);
    setError(null);
    const { data, error } = await api.POST("/api/me/skills", { body: { name: trimmed, level: 1 } });
    setPending(false);
    if (!data) return setError(problemMessage(error, "기술을 추가하지 못했어요. 잠시 뒤 다시 시도해 주세요."));
    onAdded({ id: data.id, name: data.name }); // 서버가 바꾼 표준 이름(react.js → React)
    setName("");
  }

  return (
    <fieldset className={styles.skills}>
      <legend className={styles.legend}>
        {legend} <span className={styles.legendHint}>· {selected.length}개 선택</span>
      </legend>

      <div className={styles.row}>
        {options.map((s) => {
          const isOn = selected.includes(s.id);
          return (
            <Chip key={s.id} variant="accent" pressed={isOn} onClick={() => onToggle(s.id)}>
              {isOn && <Icon name="check" size="sm" bold />}
              {s.name}
            </Chip>
          );
        })}
      </div>

      <div className={styles.row}>
        <label htmlFor="new-skill" className="sr-only">
          기술스택에 없는 기술 추가
        </label>
        <Input
          id="new-skill"
          placeholder="기술스택에 없는 기술 (예: Spring Cloud Gateway)"
          className={styles.newSkillInput}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            // Enter 로도 추가. 기본 동작(양식 제출)은 막는다
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button disabled={pending} onClick={add}>
          {pending ? "추가하는 중…" : "추가"}
        </Button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <p className={styles.meta}>
        여기서 새로 추가한 기술은 기술스택에도 “학습 중”으로 함께 저장돼요. 숙련도는 <Link href={routes.skills}>기술스택 화면</Link>에서
        바꿀 수 있어요.
      </p>
    </fieldset>
  );
}
