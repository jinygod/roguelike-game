import type { BattleEvent } from "../events/battleEvent";
import type {
  EnemyCombatant,
  EnemyId,
  HeroCombatant,
  HeroId,
} from "./combatant";

export type BattlePhase = "hero" | "enemy" | "victory" | "defeat";

export interface EnemyIntent {
  actorId: EnemyId;
  targetId: HeroId;
  skillId: string;
  damage: number;
}

export interface BattleState {
  stageId: "1-1";
  round: number;
  phase: BattlePhase;
  heroes: HeroCombatant[];
  enemies: EnemyCombatant[];
  intents: EnemyIntent[];
  selectedHeroId: HeroId | null;
  events: BattleEvent[];
}
