import type { BattlePhase } from "../../game/model/battle";
import type { HeroCombatant } from "../../game/model/combatant";

interface SkillBarProps {
  hero: HeroCombatant | null;
  phase: BattlePhase;
  selectedSkillId: string | null;
  onSelectSkill: (skillId: string) => void;
  onEndTurn: () => void;
}

export function SkillBar({
  hero,
  phase,
  selectedSkillId,
  onSelectSkill,
  onEndTurn,
}: SkillBarProps) {
  return (
    <footer className="skill-bar">
      <div className="skill-list">
        {hero ? (
          hero.skills.map((skill) => {
            const cooldown = hero.cooldowns[skill.id] ?? 0;
            const disabled =
              phase !== "hero" ||
              hero.hp <= 0 ||
              hero.actedThisRound ||
              cooldown > 0;

            return (
              <button
                key={skill.id}
                type="button"
                className="skill-button"
                data-selected={selectedSkillId === skill.id}
                disabled={disabled}
                onClick={() => onSelectSkill(skill.id)}
                aria-label={`${skill.name} 선택`}
              >
                <span>{skill.name}</span>
                <small>피해 {skill.damage}</small>
              </button>
            );
          })
        ) : (
          <p className="skill-prompt">행동할 아군을 선택하세요.</p>
        )}
      </div>

      <button
        type="button"
        className="end-turn-button"
        disabled={phase !== "hero"}
        onClick={onEndTurn}
      >
        아군 턴 종료
      </button>
    </footer>
  );
}
