import type { BattlePhase } from "../model/battle";
import type { CombatantId } from "../model/combatant";

export type BattleEvent =
  | {
      type: "skill-used";
      round: number;
      actorId: CombatantId;
      skillId: string;
      targetIds: CombatantId[];
    }
  | {
      type: "damage";
      round: number;
      sourceId: CombatantId;
      targetId: CombatantId;
      amount: number;
    }
  | {
      type: "phase-changed";
      round: number;
      phase: BattlePhase;
    };
