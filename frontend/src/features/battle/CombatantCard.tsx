import type { Combatant } from "../../game/model/combatant";

interface CombatantCardProps {
  combatant: Combatant;
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  actionLabel: string;
}

export function CombatantCard({
  combatant,
  selectable = false,
  selected = false,
  onClick,
  actionLabel,
}: CombatantCardProps) {
  const defeated = combatant.hp <= 0;
  const hpPercentage = (combatant.hp / combatant.maxHp) * 100;
  const nameplateId = `combatant-${combatant.id}-nameplate`;

  return (
    <div
      className="combatant-card-group"
      data-selected={selected}
      data-defeated={defeated}
    >
      <span id={nameplateId} className="combatant-nameplate">
        {combatant.name} · HP {combatant.hp}/{combatant.maxHp}
      </span>
      <button
        type="button"
        className="combatant-card"
        data-selected={selected}
        data-defeated={defeated}
        disabled={defeated || !onClick}
        onClick={onClick}
        aria-label={actionLabel}
        aria-describedby={nameplateId}
        aria-pressed={selectable ? selected : undefined}
      >
        <span
          className="combatant-sprite-placeholder"
          data-kind={combatant.kind}
          aria-hidden="true"
        />
      </button>
      <span className="hp-track" aria-hidden="true">
        <span
          className="hp-fill"
          style={{ width: `${hpPercentage}%` }}
        />
      </span>
    </div>
  );
}
