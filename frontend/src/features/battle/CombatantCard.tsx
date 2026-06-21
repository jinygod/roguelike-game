import type { Combatant } from "../../game/model/combatant";

interface CombatantCardProps {
  combatant: Combatant;
  selected?: boolean;
  onClick?: () => void;
  actionLabel: string;
}

export function CombatantCard({
  combatant,
  selected = false,
  onClick,
  actionLabel,
}: CombatantCardProps) {
  const defeated = combatant.hp <= 0;
  const hpPercentage = (combatant.hp / combatant.maxHp) * 100;

  return (
    <button
      type="button"
      className="combatant-card"
      data-selected={selected}
      data-defeated={defeated}
      disabled={defeated || !onClick}
      onClick={onClick}
      aria-label={actionLabel}
    >
      <span
        className="combatant-sprite-placeholder"
        data-kind={combatant.kind}
        aria-hidden="true"
      />
      <span className="combatant-nameplate">
        {combatant.name} · HP {combatant.hp}/{combatant.maxHp}
      </span>
      <span className="hp-track" aria-hidden="true">
        <span
          className="hp-fill"
          style={{ width: `${hpPercentage}%` }}
        />
      </span>
    </button>
  );
}
