import Link from "next/link";
import { routes } from "@/shared/routes";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { Input } from "@/shared/ui/Field";
import { Icon } from "@/shared/ui/Icon";
import styles from "./Project.module.css";

type SkillPickerProps = {
  options: string[]; // 고를 수 있는 기술 = 내 기술스택
  selected: string[]; // 이 프로젝트에서 쓴 기술
};

// "이 프로젝트에서 쓴 기술": 기술스택에서 고르고, 없는 기술은 바로 추가한다 (기획서 F1)
// 지금은 모양만 있다. 칩 누르기·추가 버튼은 다음 단계(③ 움직임)에서 붙인다.
export function SkillPicker({ options, selected }: SkillPickerProps) {
  return (
    <fieldset className={styles.skills}>
      <legend className={styles.legend}>
        이 프로젝트에서 쓴 기술 <span className={styles.legendHint}>· {selected.length}개 선택</span>
      </legend>

      <div className={styles.row}>
        {options.map((name) => {
          const isOn = selected.includes(name);
          return (
            <Chip key={name} variant="accent" pressed={isOn}>
              {isOn && <Icon name="check" size="sm" bold />}
              {name}
            </Chip>
          );
        })}
      </div>

      <div className={styles.row}>
        <label htmlFor="new-skill" className="sr-only">
          기술스택에 없는 기술 추가
        </label>
        <Input id="new-skill" placeholder="기술스택에 없는 기술 (예: Spring Cloud Gateway)" className={styles.newSkillInput} />
        <Button>추가</Button>
      </div>

      <p className={styles.meta}>
        여기서 새로 추가한 기술은 기술스택에도 “학습 중”으로 함께 저장돼요. 숙련도는 <Link href={routes.skills}>기술스택 화면</Link>에서
        바꿀 수 있어요.
      </p>
    </fieldset>
  );
}
