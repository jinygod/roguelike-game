import type { BattleState } from "../model/battle";
import type { EnemyId, SkillDefinition } from "../model/combatant";

export function getLegalTargets(
  battle: BattleState,
  skill: SkillDefinition,
): EnemyId[] {
  if (skill.target === "single-enemy") {
    return battle.enemies
      .filter((enemy) => enemy.hp > 0)
      .map((enemy) => enemy.id);
  }

  return [];
}
