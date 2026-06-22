import type { BattleState } from "../model/battle";
import type { BattleCommand } from "../model/command";
import { createStageOneBattle } from "./createBattle";
import { resolveEnemyTurn } from "./resolveEnemyTurn";
import { resolveHeroAction } from "./resolveHeroAction";

export function battleReducer(
  battle: BattleState,
  command: BattleCommand,
): BattleState {
  switch (command.type) {
    case "select-hero": {
      const hero = battle.heroes.find(
        (candidate) => candidate.id === command.heroId,
      );

      if (
        battle.phase !== "hero" ||
        !hero ||
        hero.hp <= 0 ||
        hero.actedThisRound
      ) {
        return battle;
      }

      return { ...battle, selectedHeroId: hero.id };
    }
    case "use-skill":
      return {
        ...resolveHeroAction(battle, command),
        selectedHeroId: null,
      };
    case "end-hero-turn":
      return battle.phase === "hero" ? resolveEnemyTurn(battle) : battle;
    case "restart":
      return createStageOneBattle();
    default: {
      const exhaustiveCommand: never = command;
      return exhaustiveCommand;
    }
  }
}
