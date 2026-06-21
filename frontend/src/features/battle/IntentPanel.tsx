import type { BattleState } from "../../game/model/battle";

interface IntentPanelProps {
  battle: BattleState;
}

export function IntentPanel({ battle }: IntentPanelProps) {
  const combatants = new Map(
    [...battle.heroes, ...battle.enemies].map((combatant) => [
      combatant.id,
      combatant,
    ]),
  );
  const showIntents =
    battle.phase !== "victory" && battle.phase !== "defeat";
  const intentRows = showIntents
    ? battle.intents.flatMap((intent, index) => {
        const actor = combatants.get(intent.actorId);
        const target = combatants.get(intent.targetId);
        const skill = actor?.skills.find(
          (candidate) => candidate.id === intent.skillId,
        );

        if (
          !actor ||
          actor.hp <= 0 ||
          !target ||
          target.hp <= 0 ||
          !skill
        ) {
          return [];
        }

        return (
          <li
            key={`${intent.actorId}-${intent.targetId}-${intent.skillId}-${index}`}
            className="intent-row"
          >
            {actor.name} → {target.name} · 피해 {skill.damage}
          </li>
        );
      })
    : [];

  return (
    <aside className="intent-panel">
      <h2>적 행동 예고</h2>
      <ul className="intent-list">{intentRows}</ul>
    </aside>
  );
}
