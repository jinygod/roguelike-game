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

  it("creates independent nested runtime state", () => {
    const first = createStageOneBattle();
    const second = createStageOneBattle();

    first.heroes[0].hp = 1;
    first.heroes[0].cooldowns.slash = 3;
    first.intents[0].damage = 99;
    first.events.push({
      type: "damage",
      round: 1,
      sourceId: "warrior",
      targetId: "rat-a",
      amount: 2,
    });

    expect(second.heroes[0].hp).toBe(12);
    expect(second.heroes[0].cooldowns).toEqual({});
    expect(second.intents[0].damage).toBe(1);
    expect(second.events).toEqual([]);
  });
});
