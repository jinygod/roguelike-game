import type { BattleEvent } from "../events/battleEvent";
import type { Combatant, CombatantId } from "./combatant";

export type BattlePhase = "hero" | "enemy" | "victory" | "defeat";

export interface EnemyIntent {
  actorId: CombatantId;
  targetId: CombatantId;
  skillId: string;
  damage: number;
}

export interface BattleState {
  stageId: "1-1";
  round: number;
  phase: BattlePhase;
  heroes: Combatant[];
  enemies: Combatant[];
  intents: EnemyIntent[];
  selectedHeroId: CombatantId | null;
  events: BattleEvent[];
}
