import { describe, expect, it } from "vitest";
import { createStageOneBattle } from "./createBattle";
import { resolveEnemyTurn } from "./resolveEnemyTurn";

describe("resolveEnemyTurn", () => {
  it("executes only intents from living enemies and starts the next hero round", () => {
    const battle = createStageOneBattle();
    const ratA = battle.enemies.find((enemy) => enemy.id === "rat-a");

    if (!ratA) {
      throw new Error("Missing rat-a test fixture");
    }

    ratA.hp = 0;
    battle.selectedHeroId = "mage";

    const result = resolveEnemyTurn(battle);

    expect(result.heroes.find((hero) => hero.id === "archer")?.hp).toBe(8);
    expect(result.heroes.find((hero) => hero.id === "mage")?.hp).toBe(6);
    expect(result.heroes.find((hero) => hero.id === "warrior")?.hp).toBe(10);
    expect(result.round).toBe(2);
    expect(result.phase).toBe("hero");
    expect(result.selectedHeroId).toBeNull();
    expect(result.intents).toEqual([
      {
        actorId: "rat-b",
        targetId: "archer",
        skillId: "bite",
        damage: 1,
      },
      {
        actorId: "slime",
        targetId: "warrior",
        skillId: "body-slam",
        damage: 2,
      },
    ]);
    expect(result.events).toEqual([
      {
        type: "damage",
        round: 1,
        sourceId: "rat-b",
        targetId: "mage",
        amount: 1,
      },
      {
        type: "damage",
        round: 1,
        sourceId: "slime",
        targetId: "warrior",
        amount: 2,
      },
      {
        type: "phase-changed",
        round: 2,
        phase: "hero",
      },
    ]);
  });

  it("returns victory before resolving attacks when every enemy is defeated", () => {
    const battle = createStageOneBattle();
    battle.enemies = battle.enemies.map((enemy) => ({ ...enemy, hp: 0 }));
    battle.heroes = battle.heroes.map((hero) => ({ ...hero, hp: 0 }));

    const result = resolveEnemyTurn(battle);

    expect(result.phase).toBe("victory");
    expect(result.round).toBe(1);
    expect(result.events).toEqual([]);
  });

  it("returns defeat before resolving attacks when every hero is defeated", () => {
    const battle = createStageOneBattle();
    battle.heroes = battle.heroes.map((hero) => ({ ...hero, hp: 0 }));

    const result = resolveEnemyTurn(battle);

    expect(result.phase).toBe("defeat");
    expect(result.round).toBe(1);
    expect(result.events).toEqual([]);
  });

  it("derives capped damage from enemy skills and skips defeated targets", () => {
    const battle = createStageOneBattle();
    const archer = battle.heroes.find((hero) => hero.id === "archer");

    if (!archer) {
      throw new Error("Missing archer test fixture");
    }

    archer.hp = 1;
    battle.intents = [
      {
        actorId: "slime",
        targetId: "archer",
        skillId: "body-slam",
        damage: 0,
      },
      {
        actorId: "rat-a",
        targetId: "archer",
        skillId: "bite",
        damage: 99,
      },
    ];

    const result = resolveEnemyTurn(battle);

    expect(result.heroes.find((hero) => hero.id === "archer")?.hp).toBe(0);
    expect(result.events).toEqual([
      {
        type: "damage",
        round: 1,
        sourceId: "slime",
        targetId: "archer",
        amount: 1,
      },
      {
        type: "phase-changed",
        round: 2,
        phase: "hero",
      },
    ]);
  });

  it("returns defeat after attacks defeat every hero", () => {
    const battle = createStageOneBattle();
    battle.heroes = battle.heroes.map((hero) => {
      const hp = hero.id === "warrior" ? 2 : 1;
      return { ...hero, hp };
    });

    const result = resolveEnemyTurn(battle);

    expect(result.phase).toBe("defeat");
    expect(result.round).toBe(1);
    expect(result.heroes.every((hero) => hero.hp === 0)).toBe(true);
    expect(result.events).toEqual([
      {
        type: "damage",
        round: 1,
        sourceId: "rat-a",
        targetId: "archer",
        amount: 1,
      },
      {
        type: "damage",
        round: 1,
        sourceId: "rat-b",
        targetId: "mage",
        amount: 1,
      },
      {
        type: "damage",
        round: 1,
        sourceId: "slime",
        targetId: "warrior",
        amount: 2,
      },
    ]);
  });

  it("does not mutate the original battle state", () => {
    const battle = createStageOneBattle();
    battle.heroes[0].cooldowns.slash = 2;
    battle.heroes[0].actedThisRound = true;
    const before = structuredClone(battle);

    const result = resolveEnemyTurn(battle);

    expect(battle).toEqual(before);
    expect(result).not.toBe(battle);
    expect(result.heroes).not.toBe(battle.heroes);
    expect(result.events).not.toBe(battle.events);
  });

  it("resets hero actions and decrements cooldowns at round transition", () => {
    const battle = createStageOneBattle();
    battle.heroes = battle.heroes.map((hero) => {
      const cooldowns: Record<string, number> =
        hero.id === "warrior"
          ? { slash: 2, guard: 0 }
          : hero.id === "archer"
            ? { shot: 1 }
            : { "magic-bolt": 0 };

      return {
        ...hero,
        actedThisRound: true,
        cooldowns,
      };
    });

    const result = resolveEnemyTurn(battle);

    expect(result.heroes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "warrior",
          actedThisRound: false,
          cooldowns: { slash: 1, guard: 0 },
        }),
        expect.objectContaining({
          id: "archer",
          actedThisRound: false,
          cooldowns: { shot: 0 },
        }),
        expect.objectContaining({
          id: "mage",
          actedThisRound: false,
          cooldowns: { "magic-bolt": 0 },
        }),
      ]),
    );
  });
});
