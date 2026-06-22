import { describe, expect, it } from "vitest";
import { createStageOneBattle } from "./createBattle";
import { resolveHeroAction } from "./resolveHeroAction";

describe("resolveHeroAction", () => {
  it("applies fixed damage, marks the actor, and records exact events", () => {
    const result = resolveHeroAction(createStageOneBattle(), {
      actorId: "archer",
      skillId: "shot",
      targetId: "rat-a",
    });

    expect(result.enemies.find((enemy) => enemy.id === "rat-a")?.hp).toBe(0);
    expect(
      result.heroes.find((hero) => hero.id === "archer")?.actedThisRound,
    ).toBe(true);
    expect(result.events).toEqual([
      {
        type: "skill-used",
        round: 1,
        actorId: "archer",
        skillId: "shot",
        targetIds: ["rat-a"],
      },
      {
        type: "damage",
        round: 1,
        sourceId: "archer",
        targetId: "rat-a",
        amount: 3,
      },
    ]);
  });

  it("rejects a second action by the same hero", () => {
    const once = resolveHeroAction(createStageOneBattle(), {
      actorId: "warrior",
      skillId: "slash",
      targetId: "slime",
    });

    expect(() =>
      resolveHeroAction(once, {
        actorId: "warrior",
        skillId: "slash",
        targetId: "slime",
      }),
    ).toThrow("이미 행동한 캐릭터입니다.");
  });

  it("rejects a defeated target", () => {
    const afterKill = resolveHeroAction(createStageOneBattle(), {
      actorId: "archer",
      skillId: "shot",
      targetId: "rat-a",
    });

    expect(() =>
      resolveHeroAction(afterKill, {
        actorId: "mage",
        skillId: "magic-bolt",
        targetId: "rat-a",
      }),
    ).toThrow("쓰러진 대상은 선택할 수 없습니다.");
  });

  it("caps the damage event amount at the target's remaining HP", () => {
    const battle = createStageOneBattle();
    const target = battle.enemies.find((enemy) => enemy.id === "rat-b");

    if (!target) {
      throw new Error("Missing rat-b test fixture");
    }

    target.hp = 1;

    const result = resolveHeroAction(battle, {
      actorId: "mage",
      skillId: "magic-bolt",
      targetId: "rat-b",
    });

    expect(result.enemies.find((enemy) => enemy.id === "rat-b")?.hp).toBe(0);
    expect(result.events).toContainEqual({
      type: "damage",
      round: 1,
      sourceId: "mage",
      targetId: "rat-b",
      amount: 1,
    });
  });

  it("does not mutate the original battle state", () => {
    const battle = createStageOneBattle();
    const before = structuredClone(battle);

    const result = resolveHeroAction(battle, {
      actorId: "warrior",
      skillId: "slash",
      targetId: "slime",
    });

    expect(battle).toEqual(before);
    expect(result).not.toBe(battle);
  });

  it("rejects actions outside the hero phase", () => {
    const battle = createStageOneBattle();
    battle.phase = "enemy";

    expect(() =>
      resolveHeroAction(battle, {
        actorId: "warrior",
        skillId: "slash",
        targetId: "slime",
      }),
    ).toThrow("아군 행동 단계가 아닙니다.");
  });

  it("rejects a defeated actor", () => {
    const battle = createStageOneBattle();
    const actor = battle.heroes.find((hero) => hero.id === "warrior");

    if (!actor) {
      throw new Error("Missing warrior test fixture");
    }

    actor.hp = 0;

    expect(() =>
      resolveHeroAction(battle, {
        actorId: "warrior",
        skillId: "slash",
        targetId: "slime",
      }),
    ).toThrow("행동할 수 없는 캐릭터입니다.");
  });

  it("rejects an unknown skill", () => {
    expect(() =>
      resolveHeroAction(createStageOneBattle(), {
        actorId: "warrior",
        skillId: "missing-skill",
        targetId: "slime",
      }),
    ).toThrow("존재하지 않는 스킬입니다.");
  });

  it("rejects a skill while its cooldown is active", () => {
    const battle = createStageOneBattle();
    const actor = battle.heroes.find((hero) => hero.id === "warrior");

    if (!actor) {
      throw new Error("Missing warrior test fixture");
    }

    actor.cooldowns.slash = 1;

    expect(() =>
      resolveHeroAction(battle, {
        actorId: "warrior",
        skillId: "slash",
        targetId: "slime",
      }),
    ).toThrow("아직 사용할 수 없는 스킬입니다.");
  });

  it("sets the used skill cooldown without mutating the original battle", () => {
    const battle = createStageOneBattle();

    battle.heroes = battle.heroes.map((hero) =>
      hero.id === "warrior"
        ? {
            ...hero,
            skills: hero.skills.map((skill) =>
              skill.id === "slash" ? { ...skill, cooldown: 2 } : skill,
            ),
          }
        : hero,
    );

    const before = structuredClone(battle);
    const originalActor = battle.heroes.find(
      (hero) => hero.id === "warrior",
    );

    const result = resolveHeroAction(battle, {
      actorId: "warrior",
      skillId: "slash",
      targetId: "slime",
    });

    const resultActor = result.heroes.find(
      (hero) => hero.id === "warrior",
    );

    expect(resultActor?.cooldowns.slash).toBe(2);
    expect(battle).toEqual(before);
    expect(resultActor?.cooldowns).not.toBe(originalActor?.cooldowns);
  });

  it("rejects an unsupported target mode explicitly", () => {
    const battle = createStageOneBattle();
    const actor = battle.heroes.find((hero) => hero.id === "warrior");

    if (!actor) {
      throw new Error("Missing warrior test fixture");
    }

    actor.skills = [
      {
        ...actor.skills[0],
        target: "same-lane-enemies",
      },
    ];

    expect(() =>
      resolveHeroAction(battle, {
        actorId: "warrior",
        skillId: "slash",
        targetId: "slime",
      }),
    ).toThrow("아직 지원하지 않는 대상 방식입니다.");
  });
});
