import { describe, expect, it } from "vitest";
import { createStageOneBattle } from "./createBattle";

describe("createStageOneBattle", () => {
  it("creates three heroes and the 1-1 enemy group", () => {
    const battle = createStageOneBattle();

    expect(battle.stageId).toBe("1-1");
    expect(battle.round).toBe(1);
    expect(battle.phase).toBe("hero");
    expect(battle.heroes.map((hero) => hero.id)).toEqual([
      "warrior",
      "archer",
      "mage",
    ]);
    expect(battle.enemies.map((enemy) => enemy.id)).toEqual([
      "rat-a",
      "rat-b",
      "slime",
    ]);
  });
});
