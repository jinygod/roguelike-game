import { createStageOneEnemies } from "../data/enemies";
import { createHeroes } from "../data/heroes";
import type { BattleState, EnemyIntent } from "../model/battle";
import type {
  EnemyCombatant,
  EnemyId,
  HeroId,
} from "../model/combatant";

const createEnemyIntent = (
  enemies: EnemyCombatant[],
  actorId: EnemyId,
  targetId: HeroId,
): EnemyIntent => {
  const enemy = enemies.find((candidate) => candidate.id === actorId);
  const skill = enemy?.skills[0];

  if (!enemy || !skill) {
    throw new Error(`Missing enemy skill for ${actorId}`);
  }

  return {
    actorId,
    targetId,
    skillId: skill.id,
    damage: skill.damage,
  };
};

const createInitialIntents = (
  enemies: EnemyCombatant[],
): EnemyIntent[] => [
  createEnemyIntent(enemies, "rat-a", "archer"),
  createEnemyIntent(enemies, "rat-b", "mage"),
  createEnemyIntent(enemies, "slime", "warrior"),
];

export function createStageOneBattle(): BattleState {
  const enemies = createStageOneEnemies();

  return {
    stageId: "1-1",
    round: 1,
    phase: "hero",
    heroes: createHeroes(),
    enemies,
    intents: createInitialIntents(enemies),
    selectedHeroId: null,
    events: [],
  };
}
