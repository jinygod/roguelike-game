import type { EnemyId, HeroId } from "./combatant";

export type BattleCommand =
  | { type: "select-hero"; heroId: HeroId }
  | {
      type: "use-skill";
      actorId: HeroId;
      skillId: string;
      targetId: EnemyId;
    }
  | { type: "end-hero-turn" }
  | { type: "restart" };
