import { describe, expect, it } from "vitest";
import { battleReducer } from "./battleReducer";
import { createStageOneBattle } from "./createBattle";

describe("battleReducer", () => {
  it("resolves a complete hero turn and starts round two in the hero phase", () => {
    const commands = [
      {
        type: "use-skill",
        actorId: "archer",
        skillId: "shot",
        targetId: "rat-a",
      },
      {
        type: "use-skill",
        actorId: "warrior",
        skillId: "slash",
        targetId: "slime",
      },
      {
        type: "use-skill",
        actorId: "mage",
        skillId: "magic-bolt",
        targetId: "rat-b",
      },
      { type: "end-hero-turn" },
    ] as const;

    const result = commands.reduce(battleReducer, createStageOneBattle());

    expect(result.round).toBe(2);
    expect(result.phase).toBe("hero");
  });

  it("restarts with a fresh stage-one battle", () => {
    let modified = battleReducer(createStageOneBattle(), {
      type: "select-hero",
      heroId: "warrior",
    });
    modified = battleReducer(modified, {
      type: "use-skill",
      actorId: "warrior",
      skillId: "slash",
      targetId: "slime",
    });
    modified = battleReducer(modified, {
      type: "select-hero",
      heroId: "archer",
    });

    expect(modified.events.length).toBeGreaterThan(0);
    expect(modified.selectedHeroId).toBe("archer");

    const restarted = battleReducer(modified, { type: "restart" });
    const fresh = createStageOneBattle();

    expect(restarted).toEqual(fresh);
    expect(restarted).not.toBe(modified);
    expect(restarted.round).toBe(1);
    expect(restarted.heroes.every((hero) => hero.hp === hero.maxHp)).toBe(
      true,
    );
    expect(restarted.enemies.every((enemy) => enemy.hp === enemy.maxHp)).toBe(
      true,
    );
    expect(restarted.intents).toEqual(fresh.intents);
    expect(restarted.events).toEqual([]);
    expect(restarted.selectedHeroId).toBeNull();
  });

  it("selects a living hero during the hero phase", () => {
    const battle = createStageOneBattle();

    const result = battleReducer(battle, {
      type: "select-hero",
      heroId: "mage",
    });

    expect(result.selectedHeroId).toBe("mage");
  });

  it("leaves state unchanged when selecting a defeated hero", () => {
    const battle = createStageOneBattle();
    battle.selectedHeroId = "warrior";
    battle.heroes = battle.heroes.map((hero) =>
      hero.id === "mage" ? { ...hero, hp: 0 } : hero,
    );

    const result = battleReducer(battle, {
      type: "select-hero",
      heroId: "mage",
    });

    expect(result).toBe(battle);
    expect(result.selectedHeroId).toBe("warrior");
  });

  it("leaves state unchanged when selecting a hero that already acted", () => {
    const battle = createStageOneBattle();
    battle.selectedHeroId = "warrior";
    battle.heroes = battle.heroes.map((hero) =>
      hero.id === "archer" ? { ...hero, actedThisRound: true } : hero,
    );

    const result = battleReducer(battle, {
      type: "select-hero",
      heroId: "archer",
    });

    expect(result).toBe(battle);
    expect(result.selectedHeroId).toBe("warrior");
  });

  it("leaves state unchanged when selecting outside the hero phase", () => {
    const battle = createStageOneBattle();
    battle.phase = "victory";
    battle.selectedHeroId = "mage";

    const result = battleReducer(battle, {
      type: "select-hero",
      heroId: "warrior",
    });

    expect(result).toBe(battle);
    expect(result.selectedHeroId).toBe("mage");
  });

  it("clears the selected hero after a successful skill", () => {
    const selected = battleReducer(createStageOneBattle(), {
      type: "select-hero",
      heroId: "archer",
    });

    const result = battleReducer(selected, {
      type: "use-skill",
      actorId: "archer",
      skillId: "shot",
      targetId: "rat-a",
    });

    expect(result.selectedHeroId).toBeNull();
    expect(
      result.heroes.find((hero) => hero.id === "archer")?.actedThisRound,
    ).toBe(true);
  });

  it.each(["victory", "defeat"] as const)(
    "leaves %s battles unchanged when ending the hero turn",
    (phase) => {
      const battle = createStageOneBattle();
      battle.phase = phase;
      battle.selectedHeroId = "warrior";

      const result = battleReducer(battle, { type: "end-hero-turn" });

      expect(result).toBe(battle);
      expect(result.phase).toBe(phase);
      expect(result.selectedHeroId).toBe("warrior");
    },
  );
});
