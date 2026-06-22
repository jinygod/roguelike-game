/// <reference types="node" />

import {
  act,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { combatantSpriteUrls } from "../../assets/pixel/sprites";
import { createStageOneBattle } from "../../game/engine/createBattle";
import type { BattlePhase } from "../../game/model/battle";
import { BattleResult } from "./BattleResult";
import { BattleScreen } from "./BattleScreen";
import { Battlefield } from "./Battlefield";
import { IntentPanel } from "./IntentPanel";

type BattleUser = ReturnType<typeof userEvent.setup>;

const portraitMediaQuery =
  "(orientation: portrait) and (max-width: 820px)";
const battleStyles = readFileSync(
  resolve("src/features/battle/battle.css"),
  "utf8",
);

function installMatchMedia(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<
    (event: MediaQueryListEvent) => void
  >();
  const addEventListener = vi.fn(
    (
      type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      if (type === "change") {
        listeners.add(listener);
      }
    },
  );
  const removeEventListener = vi.fn(
    (
      type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      if (type === "change") {
        listeners.delete(listener);
      }
    },
  );
  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: portraitMediaQuery,
    onchange: null,
    addEventListener,
    removeEventListener,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      expect(query).toBe(portraitMediaQuery);
      return mediaQueryList;
    }),
  );

  return {
    addEventListener,
    removeEventListener,
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      act(() => {
        const event = {
          matches,
          media: portraitMediaQuery,
        } as MediaQueryListEvent;

        listeners.forEach((listener) => listener(event));
      });
    },
  };
}

function getCssRule(selector: string) {
  const escapedSelector = selector.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
  const ruleMatch = battleStyles.match(
    new RegExp(`(?:^|\\n)${escapedSelector} \\{`),
  );
  const ruleStart = ruleMatch?.index ?? -1;
  const ruleEnd = battleStyles.indexOf("}", ruleStart);

  expect(ruleStart).toBeGreaterThanOrEqual(0);
  expect(ruleEnd).toBeGreaterThan(ruleStart);

  return battleStyles.slice(ruleStart, ruleEnd + 1);
}

let mediaQuery: ReturnType<typeof installMatchMedia>;

beforeEach(() => {
  mediaQuery = installMatchMedia();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function setupBattle() {
  const user = userEvent.setup();
  render(<BattleScreen />);
  return user;
}

async function performSkill(
  user: BattleUser,
  heroName: string,
  skillName: string,
  enemyName: string,
) {
  await user.click(
    screen.getByRole("button", { name: `${heroName} 선택` }),
  );
  await user.click(
    screen.getByRole("button", { name: `${skillName} 선택` }),
  );
  await user.click(
    screen.getByRole("button", { name: `${enemyName} 공격` }),
  );
}

async function endTurn(user: BattleUser) {
  await user.click(
    screen.getByRole("button", { name: "아군 턴 종료" }),
  );
}

async function winStageOne(user: BattleUser) {
  await performSkill(user, "궁수", "사격", "숲쥐 A");
  await performSkill(user, "전사", "베기", "이끼 슬라임");
  await performSkill(user, "법사", "마력탄", "숲쥐 B");
  await endTurn(user);

  await performSkill(user, "궁수", "사격", "숲쥐 B");
  await performSkill(user, "전사", "베기", "이끼 슬라임");
  await performSkill(user, "법사", "마력탄", "이끼 슬라임");
  await endTurn(user);
}

describe("IntentPanel", () => {
  it("preserves an actor intent row when its target changes", () => {
    const battle = createStageOneBattle();
    const { rerender } = render(<IntentPanel battle={battle} />);
    const firstIntentRow = screen.getAllByRole("listitem")[0];
    const retargetedBattle = {
      ...battle,
      intents: battle.intents.map((intent, index) =>
        index === 0
          ? { ...intent, targetId: "warrior" as const }
          : intent,
      ),
    };

    rerender(<IntentPanel battle={retargetedBattle} />);

    expect(screen.getAllByRole("listitem")[0]).toBe(firstIntentRow);
  });

  it("hides an intent when its target is defeated", () => {
    const battle = createStageOneBattle();
    battle.heroes = battle.heroes.map((hero) =>
      hero.id === "archer" ? { ...hero, hp: 0 } : hero,
    );

    render(<IntentPanel battle={battle} />);

    expect(
      screen.queryByText("숲쥐 A → 궁수 · 피해 1"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("이끼 슬라임 → 전사 · 피해 2"),
    ).toBeInTheDocument();
  });

  it.each(["victory", "defeat"] as const)(
    "hides every intent during the %s phase",
    (phase) => {
      const battle = createStageOneBattle();
      battle.phase = phase;

      render(<IntentPanel battle={battle} />);

      expect(
        screen.getByRole("heading", { name: "적 행동 예고" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("list")).toBeEmptyDOMElement();
    },
  );

  it("uses the actor skill damage instead of stale intent damage", () => {
    const battle = createStageOneBattle();
    battle.intents[0].damage = 99;

    render(<IntentPanel battle={battle} />);

    expect(
      screen.getByText("숲쥐 A → 궁수 · 피해 1"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("숲쥐 A → 궁수 · 피해 99"),
    ).not.toBeInTheDocument();
  });

  it("hides an intent when the actor no longer has its skill", () => {
    const battle = createStageOneBattle();
    battle.intents[0].skillId = "missing-skill";

    render(<IntentPanel battle={battle} />);

    expect(
      screen.queryByText("숲쥐 A → 궁수 · 피해 1"),
    ).not.toBeInTheDocument();
  });
});

describe("Battlefield", () => {
  it("maps every combatant to its decorative sprite without placeholders", () => {
    const battle = createStageOneBattle();

    render(
      <Battlefield
        battle={battle}
        selectedHeroId={null}
        legalTargetIds={[]}
        onSelectHero={() => undefined}
        onAttack={() => undefined}
      />,
    );

    const heroes = new Set(battle.heroes);
    const combatants = [...battle.heroes, ...battle.enemies];

    for (const combatant of combatants) {
      const action = heroes.has(
        combatant as (typeof battle.heroes)[number],
      )
        ? "선택"
        : "공격";
      const button = screen.getByRole("button", {
        name: `${combatant.name} ${action}`,
      });
      const sprite = button.querySelector("img.combatant-sprite");
      const nameplateId = `combatant-${combatant.id}-nameplate`;

      expect(sprite?.tagName).toBe("IMG");
      expect(sprite).toHaveAttribute(
        "src",
        combatantSpriteUrls[combatant.kind],
      );
      expect(sprite).toHaveAttribute("alt", "");
      expect(sprite).toHaveAttribute("draggable", "false");
      expect(button).toHaveAttribute("aria-describedby", nameplateId);
      expect(document.getElementById(nameplateId)).toBeInTheDocument();
    }

    expect(document.querySelectorAll("img.combatant-sprite")).toHaveLength(
      combatants.length,
    );
    expect(
      document.querySelector(".combatant-sprite-placeholder"),
    ).not.toBeInTheDocument();
  });

  it("enables only living enemies in the legal target list", () => {
    const battle = createStageOneBattle();
    battle.enemies = battle.enemies.map((enemy) =>
      enemy.id === "rat-a" ? { ...enemy, hp: 0 } : enemy,
    );

    render(
      <Battlefield
        battle={battle}
        selectedHeroId={null}
        legalTargetIds={["rat-a", "rat-b"]}
        onSelectHero={() => undefined}
        onAttack={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", { name: "숲쥐 A 공격" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "숲쥐 B 공격" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "이끼 슬라임 공격" }),
    ).toBeDisabled();
  });
});

describe("battle presentation styles", () => {
  it("uses one continuous forest background without a fixed scene reset", () => {
    const screenRule = getCssRule(".battle-screen");
    const gameRule = getCssRule(".battle-game");
    const battlefieldRule = getCssRule(".battlefield");

    expect(screenRule).toContain(
      'url("../../assets/pixel/goblin-forest.png")',
    );
    expect(screenRule.match(/linear-gradient/g)).toHaveLength(1);
    expect(screenRule).not.toMatch(/\bfixed\b/);
    expect(gameRule).toMatch(/background:\s*transparent/);
    expect(battlefieldRule).not.toContain("goblin-forest.png");
    expect(battlefieldRule).not.toMatch(/\bcover\b/);
  });

  it("bottom-aligns sprites in readable bounded desktop and mobile boxes", () => {
    const cardRule = getCssRule(".combatant-card");
    const spriteRule = getCssRule(".combatant-sprite");

    expect(cardRule).toMatch(/width:\s*112px/);
    expect(cardRule).toMatch(/height:\s*112px/);
    expect(cardRule).toMatch(/overflow:\s*hidden/);
    expect(spriteRule).toMatch(/object-position:\s*center bottom/);
    expect(battleStyles).toMatch(
      /@media \(max-width: 900px\) and \(orientation: landscape\)[\s\S]*?\.combatant-card \{[\s\S]*?width:\s*60px[\s\S]*?height:\s*60px/,
    );
  });
});

describe("BattleResult", () => {
  it.each([
    ["victory", "전투 승리"],
    ["defeat", "파티 전멸"],
  ] as const)(
    "renders the %s phase as a native dialog",
    (phase: BattlePhase, heading) => {
      render(
        <BattleResult phase={phase} onRestart={() => undefined} />,
      );

      const dialog = screen.getByRole("dialog", { name: heading });
      const restartButton = screen.getByRole("button", {
        name: "1-1 다시 시작",
      });

      expect(dialog.tagName).toBe("DIALOG");
      expect(dialog).toHaveAttribute("open");
      expect(dialog).not.toHaveAttribute("aria-modal");
      expect(restartButton).toHaveFocus();
    },
  );

  it("prevents canceling a terminal result dialog", () => {
    render(
      <BattleResult phase="victory" onRestart={() => undefined} />,
    );

    const dialog = screen.getByRole("dialog");
    const restartButton = screen.getByRole("button");
    const cancelEvent = new Event("cancel", { cancelable: true });

    dialog.dispatchEvent(cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(dialog).toHaveAttribute("open");
    expect(restartButton).toBeInTheDocument();
  });

  it("does not render a result during an active phase", () => {
    render(
      <BattleResult phase="hero" onRestart={() => undefined} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes while suspended and reopens with restart focused", () => {
    const { rerender } = render(
      <BattleResult
        phase="victory"
        suspended={false}
        onRestart={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", {
      name: "전투 승리",
    });

    expect(dialog).toHaveAttribute("open");

    rerender(
      <BattleResult
        phase="victory"
        suspended
        onRestart={() => undefined}
      />,
    );

    expect(dialog).not.toHaveAttribute("open");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <BattleResult
        phase="victory"
        suspended={false}
        onRestart={() => undefined}
      />,
    );

    expect(dialog).toHaveAttribute("open");
    expect(
      screen.getByRole("button", { name: "1-1 다시 시작" }),
    ).toHaveFocus();
  });
});

describe("BattleScreen", () => {
  it("defaults to landscape when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);

    render(<BattleScreen />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "궁수 선택" }),
    ).toBeInTheDocument();
  });

  it("guards portrait mode with a focused modal dialog", () => {
    mediaQuery.setMatches(true);
    render(<BattleScreen />);

    const dialog = screen.getByRole("dialog", {
      name: "전투는 모바일 가로 모드에 최적화되어 있습니다.",
    });
    const gameSurface = document.querySelector(".battle-game");

    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveFocus();
    expect(gameSurface).toHaveAttribute("inert");
    expect(gameSurface).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.queryByRole("button", { name: "궁수 선택" }),
    ).not.toBeInTheDocument();
    expect(
      within(gameSurface as HTMLElement).getAllByRole("button", {
        hidden: true,
      }),
    ).not.toHaveLength(0);
  });

  it("removes the portrait guard without resetting battle state", async () => {
    const user = setupBattle();

    await user.click(
      screen.getByRole("button", { name: "궁수 선택" }),
    );
    await user.click(
      screen.getByRole("button", { name: "사격 선택" }),
    );

    mediaQuery.setMatches(true);

    expect(screen.getByRole("dialog")).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "사격 선택" }),
    ).not.toBeInTheDocument();

    mediaQuery.setMatches(false);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "궁수 선택" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "사격 선택" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector(".battle-game")).not.toHaveAttribute(
      "inert",
    );
  });

  it("restores the previously focused control after portrait mode", async () => {
    const user = setupBattle();
    const archerButton = screen.getByRole("button", {
      name: "궁수 선택",
    });

    await user.click(archerButton);
    expect(archerButton).toHaveFocus();

    mediaQuery.setMatches(true);
    expect(screen.getByRole("dialog")).toHaveFocus();

    mediaQuery.setMatches(false);

    expect(archerButton).toHaveFocus();
  });

  it("suspends a victory result under portrait and restores it in landscape", async () => {
    const user = setupBattle();

    await winStageOne(user);

    const resultDialog = screen.getByRole("dialog", {
      name: "전투 승리",
    });
    const restartButton = screen.getByRole("button", {
      name: "1-1 다시 시작",
    });

    expect(resultDialog).toHaveAttribute("open");
    expect(restartButton).toHaveFocus();

    mediaQuery.setMatches(true);

    const orientationDialog = screen.getByRole("dialog", {
      name: "전투는 모바일 가로 모드에 최적화되어 있습니다.",
    });

    expect(screen.getAllByRole("dialog")).toEqual([
      orientationDialog,
    ]);
    expect(orientationDialog.tagName).toBe("DIALOG");
    expect(orientationDialog).toHaveAttribute("open");
    expect(orientationDialog).toHaveFocus();
    expect(resultDialog).not.toHaveAttribute("open");

    mediaQuery.setMatches(false);

    expect(screen.queryByText(
      "전투는 모바일 가로 모드에 최적화되어 있습니다.",
    )).not.toBeInTheDocument();
    expect(resultDialog).toHaveAttribute("open");
    expect(resultDialog).toBeVisible();
    expect(restartButton).toHaveFocus();
  });

  it("cleans up the portrait media query listener", () => {
    const { unmount } = render(<BattleScreen />);

    expect(mediaQuery.addEventListener).toHaveBeenCalledOnce();

    unmount();

    expect(mediaQuery.removeEventListener).toHaveBeenCalledOnce();
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("keeps every battle action as a named button", async () => {
    const user = setupBattle();

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAccessibleName();
    }

    await user.click(
      screen.getByRole("button", { name: "궁수 선택" }),
    );

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAccessibleName();
    }
  });

  it("does not render emoji characters in visible battle text", () => {
    setupBattle();

    expect(document.body.textContent).not.toMatch(
      /\p{Extended_Pictographic}/u,
    );
  });

  it("keeps every enemy action disabled before a skill is selected", () => {
    setupBattle();

    expect(
      screen.getByRole("button", { name: "숲쥐 A 공격" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "숲쥐 B 공격" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "이끼 슬라임 공격" }),
    ).toBeDisabled();
  });

  it("describes hero actions with readable HP outside the button", async () => {
    const user = setupBattle();
    const archerButton = screen.getByRole("button", {
      name: "궁수 선택",
    });
    const nameplate = screen.getByText("궁수 · HP 8/8");

    expect(archerButton.parentElement?.tagName).toBe("DIV");
    expect(archerButton).toHaveAttribute(
      "aria-describedby",
      "combatant-archer-nameplate",
    );
    expect(nameplate).toHaveAttribute(
      "id",
      "combatant-archer-nameplate",
    );
    expect(archerButton).not.toContainElement(nameplate);
    expect(archerButton).toHaveAttribute("aria-pressed", "false");

    await user.click(archerButton);

    expect(archerButton).toHaveAttribute("aria-pressed", "true");
  });

  it("exposes the selected skill with aria-pressed", async () => {
    const user = setupBattle();

    await user.click(
      screen.getByRole("button", { name: "궁수 선택" }),
    );

    const shotButton = screen.getByRole("button", {
      name: "사격 선택",
    });

    expect(shotButton).toHaveAttribute("aria-pressed", "false");

    await user.click(shotButton);

    expect(shotButton).toHaveAttribute("aria-pressed", "true");
  });

  it("lets the archer select shot and defeat rat A", async () => {
    const user = setupBattle();

    await user.click(
      screen.getByRole("button", { name: "궁수 선택" }),
    );
    await user.click(
      screen.getByRole("button", { name: "사격 선택" }),
    );
    await user.click(
      screen.getByRole("button", { name: "숲쥐 A 공격" }),
    );

    expect(
      screen.getByText("숲쥐 A · HP 0/3"),
    ).toBeInTheDocument();
  });

  it("shows enemy intents before the hero turn ends", () => {
    setupBattle();

    expect(
      screen.getByText("숲쥐 A → 궁수 · 피해 1"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("이끼 슬라임 → 전사 · 피해 2"),
    ).toBeInTheDocument();
  });

  it("disables a defeated enemy button", async () => {
    const user = setupBattle();

    await performSkill(user, "궁수", "사격", "숲쥐 A");

    expect(
      screen.getByRole("button", { name: "숲쥐 A 공격" }),
    ).toBeDisabled();
  });

  it("disables a hero selection button after that hero acts", async () => {
    const user = setupBattle();

    await performSkill(user, "궁수", "사격", "숲쥐 A");

    expect(
      screen.getByRole("button", { name: "궁수 선택" }),
    ).toBeDisabled();
  });

  it("advances the round and resolves only living enemy intents", async () => {
    const user = setupBattle();

    await performSkill(user, "궁수", "사격", "숲쥐 A");
    await endTurn(user);

    expect(screen.getByText("라운드 2")).toBeInTheDocument();
    expect(
      screen.queryByText("숲쥐 A → 궁수 · 피해 1"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("숲쥐 B → 궁수 · 피해 1"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("이끼 슬라임 → 전사 · 피해 2"),
    ).toBeInTheDocument();
    expect(screen.getByText("궁수 · HP 8/8")).toBeInTheDocument();
    expect(screen.getByText("법사 · HP 6/7")).toBeInTheDocument();
    expect(screen.getByText("전사 · HP 10/12")).toBeInTheDocument();
  });

  it("prompts the player to end the turn after every living hero acts", async () => {
    const user = setupBattle();

    await performSkill(user, "궁수", "사격", "숲쥐 A");
    await performSkill(user, "전사", "베기", "이끼 슬라임");
    await performSkill(user, "법사", "마력탄", "숲쥐 B");

    expect(
      screen.getByText(
        "행동 가능한 아군이 없습니다. 턴을 종료하세요.",
      ),
    ).toBeInTheDocument();
  });

  it("shows victory and restarts the full deterministic battle", async () => {
    const user = setupBattle();

    await winStageOne(user);

    expect(
      screen.getByRole("dialog", { name: "전투 승리" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "1-1 다시 시작" }),
    );

    expect(
      screen.getByRole("heading", { name: "1-1 숲길의 습격" }),
    ).toBeInTheDocument();
    expect(screen.getByText("라운드 1")).toBeInTheDocument();
    expect(
      screen.getByText("숲쥐 A · HP 3/3"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("숲쥐 A → 궁수 · 피해 1"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

});
