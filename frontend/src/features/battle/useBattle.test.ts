import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createStageOneBattle } from "../../game/engine/createBattle";
import { useBattle } from "./useBattle";

describe("useBattle", () => {
  it("initializes the battle controller and exposes its command API", () => {
    const { result } = renderHook(() => useBattle());

    expect(result.current.battle.round).toBe(1);
    expect(result.current.battle.phase).toBe("hero");
    expect(result.current.selectedHero).toBeNull();
    expect(result.current.selectedSkillId).toBeNull();
    expect(typeof result.current.selectHero).toBe("function");
    expect(typeof result.current.selectSkill).toBe("function");
    expect(typeof result.current.attackTarget).toBe("function");
    expect(typeof result.current.endHeroTurn).toBe("function");
    expect(typeof result.current.restart).toBe("function");
  });

  it("selects a hero and clears the previously selected skill", () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.selectHero("warrior");
    });
    act(() => {
      result.current.selectSkill("slash");
    });

    expect(result.current.selectedSkillId).toBe("slash");

    act(() => {
      result.current.selectHero("archer");
    });

    expect(result.current.selectedHero?.id).toBe("archer");
    expect(result.current.selectedSkillId).toBeNull();
  });

  it("preserves selection when the requested hero already acted", () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.selectHero("warrior");
    });
    act(() => {
      result.current.selectSkill("slash");
    });

    const archer = result.current.battle.heroes.find(
      (hero) => hero.id === "archer",
    );

    if (!archer) {
      throw new Error("Missing archer test fixture");
    }

    archer.actedThisRound = true;

    act(() => {
      result.current.selectHero("archer");
    });

    expect(result.current.selectedHero?.id).toBe("warrior");
    expect(result.current.selectedSkillId).toBe("slash");
  });

  it("preserves selection when the requested hero is defeated", () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.selectHero("warrior");
    });
    act(() => {
      result.current.selectSkill("slash");
    });

    const archer = result.current.battle.heroes.find(
      (hero) => hero.id === "archer",
    );

    if (!archer) {
      throw new Error("Missing archer test fixture");
    }

    archer.hp = 0;

    act(() => {
      result.current.selectHero("archer");
    });

    expect(result.current.selectedHero?.id).toBe("warrior");
    expect(result.current.selectedSkillId).toBe("slash");
  });

  it("preserves selection when selecting outside the hero phase", () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.selectHero("warrior");
    });
    act(() => {
      result.current.selectSkill("slash");
    });

    result.current.battle.phase = "victory";

    act(() => {
      result.current.selectHero("archer");
    });

    expect(result.current.selectedHero?.id).toBe("warrior");
    expect(result.current.selectedSkillId).toBe("slash");
  });

  it("selects a matching skill and ignores invalid skill selections", () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.selectHero("archer");
    });
    act(() => {
      result.current.selectSkill("slash");
    });

    expect(result.current.selectedSkillId).toBeNull();

    act(() => {
      result.current.selectSkill("shot");
    });

    expect(result.current.selectedSkillId).toBe("shot");

    act(() => {
      result.current.selectSkill("magic-bolt");
    });

    expect(result.current.selectedSkillId).toBe("shot");
  });

  it.each(["victory", "defeat"] as const)(
    "does not select a skill during the %s phase",
    (phase) => {
      const { result } = renderHook(() => useBattle());

      act(() => {
        result.current.selectHero("archer");
      });

      result.current.battle.phase = phase;

      act(() => {
        result.current.selectSkill("shot");
      });

      expect(result.current.selectedHero?.id).toBe("archer");
      expect(result.current.selectedSkillId).toBeNull();
    },
  );

  it.each(["victory", "defeat"] as const)(
    "preserves the current skill during the %s phase",
    (phase) => {
      const { result } = renderHook(() => useBattle());

      act(() => {
        result.current.selectHero("archer");
      });
      act(() => {
        result.current.selectSkill("shot");
      });

      const archer = result.current.battle.heroes.find(
        (hero) => hero.id === "archer",
      );
      const shot = archer?.skills.find((skill) => skill.id === "shot");

      if (!archer || !shot) {
        throw new Error("Missing archer shot test fixture");
      }

      archer.skills = [
        ...archer.skills,
        { ...shot, id: "quick-shot" },
      ];
      result.current.battle.phase = phase;

      act(() => {
        result.current.selectSkill("quick-shot");
      });

      expect(result.current.selectedHero?.id).toBe("archer");
      expect(result.current.selectedSkillId).toBe("shot");
    },
  );

  it("does not select a skill while its cooldown is active", () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.selectHero("archer");
    });

    const archer = result.current.battle.heroes.find(
      (hero) => hero.id === "archer",
    );

    if (!archer) {
      throw new Error("Missing archer test fixture");
    }

    archer.cooldowns.shot = 1;

    act(() => {
      result.current.selectSkill("shot");
    });

    expect(result.current.selectedHero?.id).toBe("archer");
    expect(result.current.selectedSkillId).toBeNull();
  });

  it("ignores attacks without a selection and resolves a selected attack", () => {
    const { result } = renderHook(() => useBattle());
    const initialBattle = result.current.battle;

    act(() => {
      result.current.attackTarget("rat-a");
    });

    expect(result.current.battle).toBe(initialBattle);

    act(() => {
      result.current.selectHero("archer");
    });
    act(() => {
      result.current.selectSkill("shot");
    });
    act(() => {
      result.current.attackTarget("rat-a");
    });

    expect(
      result.current.battle.enemies.find((enemy) => enemy.id === "rat-a")
        ?.hp,
    ).toBe(0);
    expect(result.current.selectedSkillId).toBeNull();
    expect(result.current.selectedHero).toBeNull();
    expect(result.current.battle.selectedHeroId).toBeNull();
  });

  it("ignores a defeated target without changing battle or selection", () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.selectHero("archer");
    });
    act(() => {
      result.current.selectSkill("shot");
    });
    act(() => {
      result.current.attackTarget("rat-a");
    });
    act(() => {
      result.current.selectHero("mage");
    });
    act(() => {
      result.current.selectSkill("magic-bolt");
    });

    const battleBeforeInvalidAttack = result.current.battle;
    const eventCount = result.current.battle.events.length;

    expect(() => {
      act(() => {
        result.current.attackTarget("rat-a");
      });
    }).not.toThrow();

    expect(result.current.battle).toBe(battleBeforeInvalidAttack);
    expect(
      result.current.battle.enemies.find((enemy) => enemy.id === "rat-a")
        ?.hp,
    ).toBe(0);
    expect(result.current.battle.events).toHaveLength(eventCount);
    expect(result.current.selectedHero?.id).toBe("mage");
    expect(result.current.selectedSkillId).toBe("magic-bolt");
  });

  it("ignores an attack if the selected skill enters cooldown", () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.selectHero("archer");
    });
    act(() => {
      result.current.selectSkill("shot");
    });

    const archer = result.current.battle.heroes.find(
      (hero) => hero.id === "archer",
    );
    const ratA = result.current.battle.enemies.find(
      (enemy) => enemy.id === "rat-a",
    );

    if (!archer || !ratA) {
      throw new Error("Missing cooldown attack test fixture");
    }

    archer.cooldowns.shot = 1;
    const battleBeforeAttack = result.current.battle;
    const targetHp = ratA.hp;
    const eventCount = result.current.battle.events.length;

    expect(() => {
      act(() => {
        result.current.attackTarget("rat-a");
      });
    }).not.toThrow();

    expect(result.current.battle).toBe(battleBeforeAttack);
    expect(ratA.hp).toBe(targetHp);
    expect(result.current.battle.events).toHaveLength(eventCount);
    expect(result.current.selectedHero?.id).toBe("archer");
    expect(result.current.selectedSkillId).toBe("shot");
  });

  it("clears the selected skill and advances the round when ending the hero turn", () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.selectHero("archer");
    });
    act(() => {
      result.current.selectSkill("shot");
    });

    expect(result.current.selectedSkillId).toBe("shot");

    act(() => {
      result.current.endHeroTurn();
    });

    expect(result.current.selectedSkillId).toBeNull();
    expect(result.current.battle.round).toBe(2);
    expect(result.current.battle.phase).toBe("hero");
  });

  it.each(["victory", "defeat"] as const)(
    "preserves battle and selection when ending a %s battle",
    (phase) => {
      const { result } = renderHook(() => useBattle());

      act(() => {
        result.current.selectHero("warrior");
      });
      act(() => {
        result.current.selectSkill("slash");
      });

      result.current.battle.phase = phase;
      const battleBeforeEnd = result.current.battle;

      act(() => {
        result.current.endHeroTurn();
      });

      expect(result.current.battle).toBe(battleBeforeEnd);
      expect(result.current.battle.phase).toBe(phase);
      expect(result.current.selectedHero?.id).toBe("warrior");
      expect(result.current.selectedSkillId).toBe("slash");
    },
  );

  it("restarts with a fresh battle and clears controller selections", () => {
    const { result } = renderHook(() => useBattle());

    act(() => {
      result.current.selectHero("archer");
    });
    act(() => {
      result.current.selectSkill("shot");
    });
    act(() => {
      result.current.attackTarget("rat-a");
    });
    act(() => {
      result.current.selectHero("mage");
    });
    act(() => {
      result.current.selectSkill("magic-bolt");
    });

    expect(result.current.battle.events.length).toBeGreaterThan(0);
    expect(result.current.selectedHero?.id).toBe("mage");
    expect(result.current.selectedSkillId).toBe("magic-bolt");

    act(() => {
      result.current.restart();
    });

    expect(result.current.battle).toEqual(createStageOneBattle());
    expect(result.current.selectedHero).toBeNull();
    expect(result.current.selectedSkillId).toBeNull();
  });
});
