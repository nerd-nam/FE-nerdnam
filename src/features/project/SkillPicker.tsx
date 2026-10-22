"use client";

// "이 프로젝트에서 쓴 기술": 기술스택에서 고르고, 없는 기술은 바로 추가한다 (기획서 F1)
// 칩을 누를 때마다 선택이 바뀌어야 해서 클라이언트 컴포넌트다.
import Link from "next/link";
import { useState } from "react";
import { routes } from "@/shared/routes";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { Input } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import styles from "./Project.module.css";

type SkillPickerProps = {
  initialOptions: string[]; // 고를 수 있는 기술 = 내 기술스택
  initialSelected: string[]; // 이 프로젝트에서 쓴 기술
};

export function SkillPicker({ initialOptions, initialSelected }: SkillPickerProps) {
  const [options, setOptions] = useState(initialOptions); // 칩 목록 (새로 추가한 기술이 뒤에 붙는다)
  const [selected, setSelected] = useState(initialSelected); // 고른 기술
  const [draft, setDraft] = useState(""); // "기술스택에 없는 기술" 칸에 입력 중인 글자

  // 칩 누르기: 골라져 있으면 빼고, 아니면 넣는다
  function toggle(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  }

  // 새 기술 추가: 이미 칩에 있는 이름이면(대소문자 무시) 그 칩을 고르고, 없으면 칩을 새로 만들어 고른다.
  // 표준 이름으로 바꾸는 일(react.js → React)은 저장할 때 서버가 한다 (기획서 F1, C-02 S04 확인할 것 5번)
  function addDraft() {
    const name = draft.trim();
    if (!name) return;

    const existing = options.find((item) => item.toLowerCase() === name.toLowerCase());
    const skill = existing ?? name;
    if (!existing) setOptions((prev) => [...prev, skill]);
    setSelected((prev) => (prev.includes(skill) ? prev : [...prev, skill]));
    setDraft("");
  }

  return (
    <fieldset className={styles.skills}>
      <legend className={styles.legend}>
        이 프로젝트에서 쓴 기술 <span className={styles.legendHint}>· {selected.length}개 선택</span>
      </legend>

      <div className={styles.row}>
        {options.map((name) => {
          const isOn = selected.includes(name);
          return (
            <Chip key={name} variant="accent" pressed={isOn} onClick={() => toggle(name)}>
              {isOn && <Icon name="check" size="sm" bold />}
              {name}
            </Chip>
          );
        })}
      </div>

      {/* 저장할 때 양식(form)과 함께 보내려고, 고른 기술을 화면에 안 보이는 칸에 담아 둔다 */}
      {selected.map((name) => (
        <input key={name} type="hidden" name="skills" value={name} />
      ))}

      <div className={styles.row}>
        <label htmlFor="new-skill" className="sr-only">
          기술스택에 없는 기술 추가
        </label>
        <Input
          id="new-skill"
          placeholder="기술스택에 없는 기술 (예: Spring Cloud Gateway)"
          className={styles.newSkillInput}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter 로도 추가. 기본 동작(양식 제출)은 막는다
            if (event.key === "Enter") {
              event.preventDefault();
              addDraft();
            }
          }}
        />
        <Button onClick={addDraft}>추가</Button>
      </div>

      <p className={styles.meta}>
        여기서 새로 추가한 기술은 기술스택에도 “학습 중”으로 함께 저장돼요. 숙련도는 <Link href={routes.skills}>기술스택 화면</Link>에서
        바꿀 수 있어요.
      </p>
    </fieldset>
  );
}
