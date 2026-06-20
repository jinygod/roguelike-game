import type { CombatantId } from "./combatant";

export type BattleCommand =
  | { type: "select-hero"; heroId: CombatantId }
  | {
      type: "use-skill";
      actorId: CombatantId;
      skillId: string;
      targetId: CombatantId;
    }
  | { type: "end-hero-turn" }
  | { type: "restart" };
