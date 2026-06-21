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

  return (
    <aside className="intent-panel">
      <h2>적 행동 예고</h2>
      <ul className="intent-list">
        {battle.intents.flatMap((intent) => {
          const actor = combatants.get(intent.actorId);
          const target = combatants.get(intent.targetId);

          if (!actor || actor.hp <= 0 || !target) {
            return [];
          }

          return (
            <li key={intent.actorId} className="intent-row">
              {actor.name} → {target.name} · 피해 {intent.damage}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
