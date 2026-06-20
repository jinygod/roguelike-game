import { createStageOneEnemies } from "../data/enemies";
import { createHeroes } from "../data/heroes";
import type { BattleState, EnemyIntent } from "../model/battle";

const createInitialIntents = (): EnemyIntent[] => [
  { actorId: "rat-a", targetId: "archer", skillId: "bite", damage: 1 },
  { actorId: "rat-b", targetId: "mage", skillId: "bite", damage: 1 },
  {
    actorId: "slime",
    targetId: "warrior",
    skillId: "body-slam",
    damage: 2,
  },
];

export function createStageOneBattle(): BattleState {
  return {
    stageId: "1-1",
    round: 1,
    phase: "hero",
    heroes: createHeroes(),
    enemies: createStageOneEnemies(),
    intents: createInitialIntents(),
    selectedHeroId: null,
    events: [],
  };
}
