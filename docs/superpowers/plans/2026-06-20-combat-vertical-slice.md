# Combat Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, test-covered 1-1 battle that runs in a PC browser and a mobile landscape browser, using the warrior, archer, and mage against two rats and one slime.

**Architecture:** Keep combat rules in pure TypeScript modules with no React imports. React renders battle state and dispatches commands through a small controller hook. The first slice uses local state only; Spring Boot telemetry, the remaining four stages, augment selection, and the private analytics lab receive separate implementation plans after this battle is fun.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, CSS, AI-generated pixel-art PNG assets

---

## Scope boundary

This plan intentionally implements only the first independently testable subsystem:

- repository-friendly frontend scaffold;
- deterministic 1-1 combat engine;
- enemy intent preview;
- three directly controlled heroes;
- three-lane front/back positioning model;
- desktop and mobile-landscape battle UI;
- one complete battle, victory, defeat, and restart;
- temporary local battle event history for debugging.

The following work is deferred to later plans:

1. stages 1-2 through 1-5, route risks, augments, revival, and permanent unlocks;
2. Spring Boot, PostgreSQL, Flyway, event delivery, and anonymous device IDs;
3. the private balance laboratory, replay, CSV export, and read-only queries.

## Target file structure

```text
frontend/
  package.json
  vite.config.ts
  src/
    app/
      App.tsx
      App.test.tsx
    game/
      model/
        battle.ts
        combatant.ts
        command.ts
      data/
        heroes.ts
        enemies.ts
        stages.ts
      engine/
        createBattle.ts
        createBattle.test.ts
        getLegalTargets.ts
        resolveHeroAction.ts
        resolveHeroAction.test.ts
        resolveEnemyTurn.ts
        resolveEnemyTurn.test.ts
        battleReducer.ts
        battleReducer.test.ts
      events/
        battleEvent.ts
    features/
      battle/
        useBattle.ts
        BattleScreen.tsx
        Battlefield.tsx
        CombatantCard.tsx
        IntentPanel.tsx
        SkillBar.tsx
        BattleResult.tsx
        battle.css
    assets/
      pixel/
        warrior.png
        archer.png
        mage.png
        rat.png
        slime.png
        goblin-forest.png
        sprites.ts
    test/
      setup.ts
    main.tsx
    styles.css
```

Each engine file owns one rule. UI files may read battle state and dispatch commands, but may not calculate damage, choose enemy targets, or mutate combatants.

### Task 1: Scaffold the React test environment

**Files:**
- Create: `frontend/`
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/test/setup.ts`
- Modify: `frontend/src/app/App.tsx`
- Create: `frontend/src/app/App.test.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Generate the Vite project**

Run:

```powershell
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: `frontend/package.json` exists and `npm install` exits with code 0.

- [ ] **Step 2: Add test scripts**

Run from `frontend/`:

```powershell
npm pkg set scripts.test="vitest run"
npm pkg set scripts.test:watch="vitest"
npm pkg set scripts.check="npm run test && npm run lint && npm run build"
```

Expected: `npm run` lists `test`, `test:watch`, and `check`.

- [ ] **Step 3: Configure Vitest**

Replace `frontend/vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    restoreMocks: true,
  },
});
```

Create `frontend/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Write the failing app smoke test**

Create `frontend/src/app/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("shows the chapter and stage name", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "1-1 숲길의 습격" }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the smoke test and verify failure**

Run:

```powershell
npm test -- src/app/App.test.tsx
```

Expected: FAIL because `src/app/App.tsx` does not yet export the required `App`.

- [ ] **Step 6: Add the minimal app shell**

Create `frontend/src/app/App.tsx`:

```tsx
export function App() {
  return (
    <main>
      <h1>1-1 숲길의 습격</h1>
    </main>
  );
}
```

Replace `frontend/src/main.tsx` with:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 7: Verify the scaffold**

Run:

```powershell
npm run check
```

Expected: tests, lint, and production build all exit with code 0.

- [ ] **Step 8: Commit**

```powershell
git add frontend
git commit -m "build: scaffold combat frontend"
```

### Task 2: Define the combat domain and stage data

**Files:**
- Create: `frontend/src/game/model/combatant.ts`
- Create: `frontend/src/game/model/battle.ts`
- Create: `frontend/src/game/model/command.ts`
- Create: `frontend/src/game/events/battleEvent.ts`
- Create: `frontend/src/game/data/heroes.ts`
- Create: `frontend/src/game/data/enemies.ts`
- Create: `frontend/src/game/data/stages.ts`
- Create: `frontend/src/game/engine/createBattle.test.ts`
- Create: `frontend/src/game/engine/createBattle.ts`

- [ ] **Step 1: Write the failing battle creation test**

Create `frontend/src/game/engine/createBattle.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```powershell
npm test -- src/game/engine/createBattle.test.ts
```

Expected: FAIL because `createBattle.ts` does not exist.

- [ ] **Step 3: Define the domain types**

Create `frontend/src/game/model/combatant.ts`:

```ts
export type Team = "hero" | "enemy";
export type Lane = 0 | 1 | 2;
export type Rank = "front" | "back";
export type HeroId = "warrior" | "archer" | "mage";
export type EnemyKind = "rat" | "slime";
export type CombatantId = HeroId | "rat-a" | "rat-b" | "slime";

export interface Position {
  lane: Lane;
  rank: Rank;
}

export interface SkillDefinition {
  id: string;
  name: string;
  damage: number;
  cooldown: number;
  target: "single-enemy" | "same-lane-enemies";
}

export interface Combatant {
  id: CombatantId;
  name: string;
  team: Team;
  kind: HeroId | EnemyKind;
  hp: number;
  maxHp: number;
  position: Position;
  skills: SkillDefinition[];
  cooldowns: Record<string, number>;
  actedThisRound: boolean;
}
```

Create `frontend/src/game/model/battle.ts`:

```ts
import type { Combatant, CombatantId } from "./combatant";
import type { BattleEvent } from "../events/battleEvent";

export type BattlePhase = "hero" | "enemy" | "victory" | "defeat";

export interface EnemyIntent {
  actorId: CombatantId;
  targetId: CombatantId;
  skillId: string;
  damage: number;
}

export interface BattleState {
  stageId: "1-1";
  round: number;
  phase: BattlePhase;
  heroes: Combatant[];
  enemies: Combatant[];
  intents: EnemyIntent[];
  selectedHeroId: CombatantId | null;
  events: BattleEvent[];
}
```

Create `frontend/src/game/model/command.ts`:

```ts
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
```

Create `frontend/src/game/events/battleEvent.ts`:

```ts
import type { BattlePhase } from "../model/battle";
import type { CombatantId } from "../model/combatant";

export type BattleEvent =
  | {
      type: "skill-used";
      round: number;
      actorId: CombatantId;
      skillId: string;
      targetIds: CombatantId[];
    }
  | {
      type: "damage";
      round: number;
      sourceId: CombatantId;
      targetId: CombatantId;
      amount: number;
    }
  | {
      type: "phase-changed";
      round: number;
      phase: BattlePhase;
    };
```

- [ ] **Step 4: Add hero and enemy data**

Create `frontend/src/game/data/heroes.ts`:

```ts
import type { Combatant } from "../model/combatant";

export const createHeroes = (): Combatant[] => [
  {
    id: "warrior",
    name: "전사",
    team: "hero",
    kind: "warrior",
    hp: 12,
    maxHp: 12,
    position: { lane: 1, rank: "front" },
    skills: [
      {
        id: "slash",
        name: "베기",
        damage: 2,
        cooldown: 0,
        target: "single-enemy",
      },
    ],
    cooldowns: {},
    actedThisRound: false,
  },
  {
    id: "archer",
    name: "궁수",
    team: "hero",
    kind: "archer",
    hp: 8,
    maxHp: 8,
    position: { lane: 0, rank: "back" },
    skills: [
      {
        id: "shot",
        name: "사격",
        damage: 3,
        cooldown: 0,
        target: "single-enemy",
      },
    ],
    cooldowns: {},
    actedThisRound: false,
  },
  {
    id: "mage",
    name: "법사",
    team: "hero",
    kind: "mage",
    hp: 7,
    maxHp: 7,
    position: { lane: 2, rank: "back" },
    skills: [
      {
        id: "magic-bolt",
        name: "마력탄",
        damage: 2,
        cooldown: 0,
        target: "single-enemy",
      },
    ],
    cooldowns: {},
    actedThisRound: false,
  },
];
```

Create `frontend/src/game/data/enemies.ts`:

```ts
import type { Combatant } from "../model/combatant";

export const createStageOneEnemies = (): Combatant[] => [
  {
    id: "rat-a",
    name: "숲쥐 A",
    team: "enemy",
    kind: "rat",
    hp: 3,
    maxHp: 3,
    position: { lane: 0, rank: "front" },
    skills: [
      {
        id: "bite",
        name: "물기",
        damage: 1,
        cooldown: 0,
        target: "single-enemy",
      },
    ],
    cooldowns: {},
    actedThisRound: false,
  },
  {
    id: "rat-b",
    name: "숲쥐 B",
    team: "enemy",
    kind: "rat",
    hp: 3,
    maxHp: 3,
    position: { lane: 2, rank: "front" },
    skills: [
      {
        id: "bite",
        name: "물기",
        damage: 1,
        cooldown: 0,
        target: "single-enemy",
      },
    ],
    cooldowns: {},
    actedThisRound: false,
  },
  {
    id: "slime",
    name: "이끼 슬라임",
    team: "enemy",
    kind: "slime",
    hp: 5,
    maxHp: 5,
    position: { lane: 1, rank: "back" },
    skills: [
      {
        id: "body-slam",
        name: "몸통박치기",
        damage: 2,
        cooldown: 0,
        target: "single-enemy",
      },
    ],
    cooldowns: {},
    actedThisRound: false,
  },
];
```

Create `frontend/src/game/data/stages.ts`:

```ts
export const stageOne = {
  id: "1-1" as const,
  name: "숲길의 습격",
  tutorial: [
    "캐릭터를 선택하세요.",
    "스킬을 선택한 뒤 공격 대상을 고르세요.",
    "세 캐릭터의 행동이 끝나면 적이 예고한 공격을 실행합니다.",
  ],
};
```

- [ ] **Step 5: Create the initial battle**

Create `frontend/src/game/engine/createBattle.ts`:

```ts
import { createStageOneEnemies } from "../data/enemies";
import { createHeroes } from "../data/heroes";
import type { BattleState, EnemyIntent } from "../model/battle";

const createInitialIntents = (): EnemyIntent[] => [
  { actorId: "rat-a", targetId: "archer", skillId: "bite", damage: 1 },
  { actorId: "rat-b", targetId: "mage", skillId: "bite", damage: 1 },
  {
    actorId: "slime",
    targetId: "warrior",
    skillId: "body-slam",
    damage: 2,
  },
];

export function createStageOneBattle(): BattleState {
  return {
    stageId: "1-1",
    round: 1,
    phase: "hero",
    heroes: createHeroes(),
    enemies: createStageOneEnemies(),
    intents: createInitialIntents(),
    selectedHeroId: null,
    events: [],
  };
}
```

- [ ] **Step 6: Verify the battle fixture**

Run:

```powershell
npm test -- src/game/engine/createBattle.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/game
git commit -m "feat: define stage one combat model"
```

### Task 3: Resolve hero skills deterministically

**Files:**
- Create: `frontend/src/game/engine/getLegalTargets.ts`
- Create: `frontend/src/game/engine/resolveHeroAction.test.ts`
- Create: `frontend/src/game/engine/resolveHeroAction.ts`

- [ ] **Step 1: Write failing tests for damage and defeated targets**

Create `frontend/src/game/engine/resolveHeroAction.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createStageOneBattle } from "./createBattle";
import { resolveHeroAction } from "./resolveHeroAction";

describe("resolveHeroAction", () => {
  it("applies fixed damage and records events", () => {
    const result = resolveHeroAction(createStageOneBattle(), {
      actorId: "archer",
      skillId: "shot",
      targetId: "rat-a",
    });

    expect(result.enemies.find((enemy) => enemy.id === "rat-a")?.hp).toBe(0);
    expect(
      result.heroes.find((hero) => hero.id === "archer")?.actedThisRound,
    ).toBe(true);
    expect(result.events).toContainEqual({
      type: "damage",
      round: 1,
      sourceId: "archer",
      targetId: "rat-a",
      amount: 3,
    });
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
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```powershell
npm test -- src/game/engine/resolveHeroAction.test.ts
```

Expected: FAIL because `resolveHeroAction.ts` does not exist.

- [ ] **Step 3: Add legal target selection**

Create `frontend/src/game/engine/getLegalTargets.ts`:

```ts
import type { BattleState } from "../model/battle";
import type { CombatantId, SkillDefinition } from "../model/combatant";

export function getLegalTargets(
  battle: BattleState,
  skill: SkillDefinition,
): CombatantId[] {
  if (skill.target === "single-enemy") {
    return battle.enemies
      .filter((enemy) => enemy.hp > 0)
      .map((enemy) => enemy.id);
  }

  return [];
}
```

- [ ] **Step 4: Implement hero action resolution**

Create `frontend/src/game/engine/resolveHeroAction.ts`:

```ts
import type { BattleState } from "../model/battle";
import type { CombatantId } from "../model/combatant";
import { getLegalTargets } from "./getLegalTargets";

export interface HeroAction {
  actorId: CombatantId;
  skillId: string;
  targetId: CombatantId;
}

export function resolveHeroAction(
  battle: BattleState,
  action: HeroAction,
): BattleState {
  if (battle.phase !== "hero") {
    throw new Error("아군 행동 단계가 아닙니다.");
  }

  const actor = battle.heroes.find((hero) => hero.id === action.actorId);
  if (!actor || actor.hp <= 0) {
    throw new Error("행동할 수 없는 캐릭터입니다.");
  }
  if (actor.actedThisRound) {
    throw new Error("이미 행동한 캐릭터입니다.");
  }

  const skill = actor.skills.find((candidate) => candidate.id === action.skillId);
  if (!skill) {
    throw new Error("존재하지 않는 스킬입니다.");
  }
  if (!getLegalTargets(battle, skill).includes(action.targetId)) {
    throw new Error("쓰러진 대상은 선택할 수 없습니다.");
  }

  const target = battle.enemies.find((enemy) => enemy.id === action.targetId)!;
  const appliedDamage = Math.min(target.hp, skill.damage);

  return {
    ...battle,
    heroes: battle.heroes.map((hero) =>
      hero.id === actor.id ? { ...hero, actedThisRound: true } : hero,
    ),
    enemies: battle.enemies.map((enemy) =>
      enemy.id === target.id
        ? { ...enemy, hp: Math.max(0, enemy.hp - skill.damage) }
        : enemy,
    ),
    events: [
      ...battle.events,
      {
        type: "skill-used",
        round: battle.round,
        actorId: actor.id,
        skillId: skill.id,
        targetIds: [target.id],
      },
      {
        type: "damage",
        round: battle.round,
        sourceId: actor.id,
        targetId: target.id,
        amount: appliedDamage,
      },
    ],
  };
}
```

- [ ] **Step 5: Verify hero action rules**

Run:

```powershell
npm test -- src/game/engine/resolveHeroAction.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/game/engine
git commit -m "feat: resolve deterministic hero actions"
```

### Task 4: Resolve enemy intents and battle results

**Files:**
- Create: `frontend/src/game/engine/resolveEnemyTurn.test.ts`
- Create: `frontend/src/game/engine/resolveEnemyTurn.ts`

- [ ] **Step 1: Write failing enemy turn tests**

Create `frontend/src/game/engine/resolveEnemyTurn.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createStageOneBattle } from "./createBattle";
import { resolveEnemyTurn } from "./resolveEnemyTurn";

describe("resolveEnemyTurn", () => {
  it("executes only intents from living enemies", () => {
    const battle = createStageOneBattle();
    battle.enemies[0] = { ...battle.enemies[0], hp: 0 };

    const result = resolveEnemyTurn(battle);

    expect(result.heroes.find((hero) => hero.id === "archer")?.hp).toBe(8);
    expect(result.heroes.find((hero) => hero.id === "mage")?.hp).toBe(6);
    expect(result.heroes.find((hero) => hero.id === "warrior")?.hp).toBe(10);
    expect(result.round).toBe(2);
    expect(result.phase).toBe("hero");
  });

  it("returns victory when every enemy is defeated", () => {
    const battle = createStageOneBattle();
    battle.enemies = battle.enemies.map((enemy) => ({ ...enemy, hp: 0 }));

    expect(resolveEnemyTurn(battle).phase).toBe("victory");
  });

  it("returns defeat when every hero is defeated", () => {
    const battle = createStageOneBattle();
    battle.heroes = battle.heroes.map((hero) => ({ ...hero, hp: 0 }));

    expect(resolveEnemyTurn(battle).phase).toBe("defeat");
  });
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```powershell
npm test -- src/game/engine/resolveEnemyTurn.test.ts
```

Expected: FAIL because `resolveEnemyTurn.ts` does not exist.

- [ ] **Step 3: Implement enemy intent resolution**

Create `frontend/src/game/engine/resolveEnemyTurn.ts`:

```ts
import type { BattleState, EnemyIntent } from "../model/battle";
import type { Combatant, CombatantId } from "../model/combatant";

function allDefeated(combatants: Combatant[]) {
  return combatants.every((combatant) => combatant.hp <= 0);
}

function createNextIntent(
  enemy: Combatant,
  livingHeroIds: CombatantId[],
  round: number,
): EnemyIntent {
  const targetId = livingHeroIds[
    (round + enemy.position.lane) % livingHeroIds.length
  ];
  const skill = enemy.skills[0];

  return {
    actorId: enemy.id,
    targetId,
    skillId: skill.id,
    damage: skill.damage,
  };
}

export function resolveEnemyTurn(battle: BattleState): BattleState {
  if (allDefeated(battle.enemies)) {
    return { ...battle, phase: "victory" };
  }
  if (allDefeated(battle.heroes)) {
    return { ...battle, phase: "defeat" };
  }

  let heroes = battle.heroes.map((hero) => ({ ...hero }));
  let events = [...battle.events];

  for (const intent of battle.intents) {
    const actor = battle.enemies.find((enemy) => enemy.id === intent.actorId);
    const target = heroes.find((hero) => hero.id === intent.targetId);
    if (!actor || actor.hp <= 0 || !target || target.hp <= 0) {
      continue;
    }

    const appliedDamage = Math.min(target.hp, intent.damage);
    heroes = heroes.map((hero) =>
      hero.id === target.id
        ? { ...hero, hp: Math.max(0, hero.hp - intent.damage) }
        : hero,
    );
    events.push({
      type: "damage",
      round: battle.round,
      sourceId: actor.id,
      targetId: target.id,
      amount: appliedDamage,
    });
  }

  if (allDefeated(heroes)) {
    return { ...battle, heroes, events, phase: "defeat" };
  }

  const nextRound = battle.round + 1;
  const livingHeroIds = heroes
    .filter((hero) => hero.hp > 0)
    .map((hero) => hero.id);
  const intents = battle.enemies
    .filter((enemy) => enemy.hp > 0)
    .map((enemy) => createNextIntent(enemy, livingHeroIds, nextRound));

  return {
    ...battle,
    round: nextRound,
    phase: "hero",
    heroes: heroes.map((hero) => ({ ...hero, actedThisRound: false })),
    intents,
    selectedHeroId: null,
    events: [
      ...events,
      { type: "phase-changed", round: nextRound, phase: "hero" },
    ],
  };
}
```

- [ ] **Step 4: Verify enemy resolution**

Run:

```powershell
npm test -- src/game/engine/resolveEnemyTurn.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/game/engine
git commit -m "feat: execute enemy intents and battle results"
```

### Task 5: Add a reducer and controller hook

**Files:**
- Create: `frontend/src/game/engine/battleReducer.test.ts`
- Create: `frontend/src/game/engine/battleReducer.ts`
- Create: `frontend/src/features/battle/useBattle.ts`

- [ ] **Step 1: Write the failing reducer flow test**

Create `frontend/src/game/engine/battleReducer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { battleReducer } from "./battleReducer";
import { createStageOneBattle } from "./createBattle";

describe("battleReducer", () => {
  it("runs three hero actions and then the enemy turn", () => {
    let battle = createStageOneBattle();

    battle = battleReducer(battle, {
      type: "use-skill",
      actorId: "archer",
      skillId: "shot",
      targetId: "rat-a",
    });
    battle = battleReducer(battle, {
      type: "use-skill",
      actorId: "warrior",
      skillId: "slash",
      targetId: "slime",
    });
    battle = battleReducer(battle, {
      type: "use-skill",
      actorId: "mage",
      skillId: "magic-bolt",
      targetId: "rat-b",
    });
    battle = battleReducer(battle, { type: "end-hero-turn" });

    expect(battle.round).toBe(2);
    expect(battle.phase).toBe("hero");
  });

  it("restarts from the initial state", () => {
    const battle = battleReducer(createStageOneBattle(), {
      type: "restart",
    });

    expect(battle.round).toBe(1);
    expect(battle.events).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the reducer tests and verify failure**

Run:

```powershell
npm test -- src/game/engine/battleReducer.test.ts
```

Expected: FAIL because `battleReducer.ts` does not exist.

- [ ] **Step 3: Implement the reducer**

Create `frontend/src/game/engine/battleReducer.ts`:

```ts
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
    case "select-hero":
      return { ...battle, selectedHeroId: command.heroId };
    case "use-skill":
      return resolveHeroAction(battle, command);
    case "end-hero-turn":
      return resolveEnemyTurn(battle);
    case "restart":
      return createStageOneBattle();
  }
}
```

- [ ] **Step 4: Implement the controller hook**

Create `frontend/src/features/battle/useBattle.ts`:

```ts
import { useMemo, useReducer, useState } from "react";
import type { CombatantId } from "../../game/model/combatant";
import { battleReducer } from "../../game/engine/battleReducer";
import { createStageOneBattle } from "../../game/engine/createBattle";

export function useBattle() {
  const [battle, dispatch] = useReducer(
    battleReducer,
    undefined,
    createStageOneBattle,
  );
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const selectedHero = useMemo(
    () => battle.heroes.find((hero) => hero.id === battle.selectedHeroId) ?? null,
    [battle.heroes, battle.selectedHeroId],
  );

  function selectHero(heroId: CombatantId) {
    dispatch({ type: "select-hero", heroId });
    setSelectedSkillId(null);
  }

  function selectSkill(skillId: string) {
    setSelectedSkillId(skillId);
  }

  function attackTarget(targetId: CombatantId) {
    if (!selectedHero || !selectedSkillId) {
      return;
    }
    dispatch({
      type: "use-skill",
      actorId: selectedHero.id,
      skillId: selectedSkillId,
      targetId,
    });
    setSelectedSkillId(null);
  }

  return {
    battle,
    selectedHero,
    selectedSkillId,
    selectHero,
    selectSkill,
    attackTarget,
    endHeroTurn: () => dispatch({ type: "end-hero-turn" }),
    restart: () => dispatch({ type: "restart" }),
  };
}
```

- [ ] **Step 5: Verify reducer and full unit suite**

Run:

```powershell
npm test
```

Expected: all engine and app tests pass.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/game/engine frontend/src/features/battle/useBattle.ts
git commit -m "feat: add battle command controller"
```

### Task 6: Build the playable battle UI

**Files:**
- Create: `frontend/src/features/battle/CombatantCard.tsx`
- Create: `frontend/src/features/battle/Battlefield.tsx`
- Create: `frontend/src/features/battle/IntentPanel.tsx`
- Create: `frontend/src/features/battle/SkillBar.tsx`
- Create: `frontend/src/features/battle/BattleResult.tsx`
- Create: `frontend/src/features/battle/BattleScreen.tsx`
- Create: `frontend/src/features/battle/BattleScreen.test.tsx`
- Modify: `frontend/src/app/App.tsx`

- [ ] **Step 1: Write a failing interaction test**

Create `frontend/src/features/battle/BattleScreen.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BattleScreen } from "./BattleScreen";

describe("BattleScreen", () => {
  it("lets the archer select shot and defeat a rat", async () => {
    const user = userEvent.setup();
    render(<BattleScreen />);

    await user.click(screen.getByRole("button", { name: "궁수 선택" }));
    await user.click(screen.getByRole("button", { name: "사격 선택" }));
    await user.click(screen.getByRole("button", { name: "숲쥐 A 공격" }));

    expect(screen.getByText("숲쥐 A · HP 0/3")).toBeInTheDocument();
  });

  it("shows enemy intent before ending the hero turn", () => {
    render(<BattleScreen />);

    expect(screen.getByText("숲쥐 A → 궁수 · 피해 1")).toBeInTheDocument();
    expect(screen.getByText("이끼 슬라임 → 전사 · 피해 2")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the UI tests and verify failure**

Run:

```powershell
npm test -- src/features/battle/BattleScreen.test.tsx
```

Expected: FAIL because the battle components do not exist.

- [ ] **Step 3: Create the reusable combatant card**

Create `frontend/src/features/battle/CombatantCard.tsx`:

```tsx
import type { Combatant } from "../../game/model/combatant";

interface CombatantCardProps {
  combatant: Combatant;
  selected?: boolean;
  onClick?: () => void;
  actionLabel: string;
}

export function CombatantCard({
  combatant,
  selected = false,
  onClick,
  actionLabel,
}: CombatantCardProps) {
  const defeated = combatant.hp <= 0;

  return (
    <button
      className="combatant-card"
      data-selected={selected}
      data-defeated={defeated}
      disabled={defeated}
      onClick={onClick}
      aria-label={actionLabel}
    >
      <span
        className="combatant-sprite combatant-sprite-placeholder"
        data-kind={combatant.kind}
        aria-hidden="true"
      />
      <span>
        {combatant.name} · HP {combatant.hp}/{combatant.maxHp}
      </span>
      <span className="hp-track">
        <span
          className="hp-fill"
          style={{ width: `${(combatant.hp / combatant.maxHp) * 100}%` }}
        />
      </span>
    </button>
  );
}
```

- [ ] **Step 4: Create battlefield, intents, skills, and result components**

Create `frontend/src/features/battle/Battlefield.tsx`:

```tsx
import type { BattleState } from "../../game/model/battle";
import type { CombatantId } from "../../game/model/combatant";
import { CombatantCard } from "./CombatantCard";

interface BattlefieldProps {
  battle: BattleState;
  selectedHeroId: CombatantId | null;
  canAttack: boolean;
  onSelectHero: (id: CombatantId) => void;
  onAttack: (id: CombatantId) => void;
}

export function Battlefield({
  battle,
  selectedHeroId,
  canAttack,
  onSelectHero,
  onAttack,
}: BattlefieldProps) {
  return (
    <section className="battlefield" aria-label="전장">
      <div className="team team-heroes">
        {battle.heroes.map((hero) => (
          <CombatantCard
            key={hero.id}
            combatant={hero}
            selected={hero.id === selectedHeroId}
            onClick={() => onSelectHero(hero.id)}
            actionLabel={`${hero.name} 선택`}
          />
        ))}
      </div>
      <div className="lane-lines" aria-hidden="true" />
      <div className="team team-enemies">
        {battle.enemies.map((enemy) => (
          <CombatantCard
            key={enemy.id}
            combatant={enemy}
            onClick={canAttack ? () => onAttack(enemy.id) : undefined}
            actionLabel={`${enemy.name} 공격`}
          />
        ))}
      </div>
    </section>
  );
}
```

Create `frontend/src/features/battle/IntentPanel.tsx`:

```tsx
import type { BattleState } from "../../game/model/battle";

export function IntentPanel({ battle }: { battle: BattleState }) {
  const names = new Map(
    [...battle.heroes, ...battle.enemies].map((combatant) => [
      combatant.id,
      combatant.name,
    ]),
  );

  return (
    <aside className="intent-panel">
      <h2>적 행동 예고</h2>
      <ul>
        {battle.intents.map((intent) => (
          <li key={intent.actorId}>
            {names.get(intent.actorId)} → {names.get(intent.targetId)} · 피해{" "}
            {intent.damage}
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

Create `frontend/src/features/battle/SkillBar.tsx`:

```tsx
import type { Combatant } from "../../game/model/combatant";

interface SkillBarProps {
  hero: Combatant | null;
  selectedSkillId: string | null;
  onSelectSkill: (skillId: string) => void;
  onEndTurn: () => void;
}

export function SkillBar({
  hero,
  selectedSkillId,
  onSelectSkill,
  onEndTurn,
}: SkillBarProps) {
  return (
    <footer className="skill-bar">
      <div className="skill-list">
        {hero ? (
          hero.skills.map((skill) => (
            <button
              key={skill.id}
              data-selected={selectedSkillId === skill.id}
              disabled={hero.actedThisRound}
              onClick={() => onSelectSkill(skill.id)}
              aria-label={`${skill.name} 선택`}
            >
              {skill.name}
              <small>피해 {skill.damage}</small>
            </button>
          ))
        ) : (
          <p>행동할 캐릭터를 선택하세요.</p>
        )}
      </div>
      <button className="end-turn" onClick={onEndTurn}>
        아군 턴 종료
      </button>
    </footer>
  );
}
```

Create `frontend/src/features/battle/BattleResult.tsx`:

```tsx
import type { BattlePhase } from "../../game/model/battle";

interface BattleResultProps {
  phase: BattlePhase;
  onRestart: () => void;
}

export function BattleResult({ phase, onRestart }: BattleResultProps) {
  if (phase !== "victory" && phase !== "defeat") {
    return null;
  }

  return (
    <section className="battle-result" role="dialog" aria-modal="true">
      <h2>{phase === "victory" ? "전투 승리" : "파티 전멸"}</h2>
      <button onClick={onRestart}>1-1 다시 시작</button>
    </section>
  );
}
```

- [ ] **Step 5: Compose the battle screen**

Create `frontend/src/features/battle/BattleScreen.tsx`:

```tsx
import { stageOne } from "../../game/data/stages";
import { BattleResult } from "./BattleResult";
import { Battlefield } from "./Battlefield";
import { IntentPanel } from "./IntentPanel";
import { SkillBar } from "./SkillBar";
import { useBattle } from "./useBattle";
import "./battle.css";

export function BattleScreen() {
  const controller = useBattle();
  const livingHeroesWhoCanAct = controller.battle.heroes.filter(
    (hero) => hero.hp > 0 && !hero.actedThisRound,
  );

  return (
    <main className="battle-screen">
      <header className="battle-header">
        <div>
          <p>CHAPTER 1 · ROUND {controller.battle.round}</p>
          <h1>
            {stageOne.id} {stageOne.name}
          </h1>
        </div>
        <IntentPanel battle={controller.battle} />
      </header>

      <Battlefield
        battle={controller.battle}
        selectedHeroId={controller.selectedHero?.id ?? null}
        canAttack={controller.selectedSkillId !== null}
        onSelectHero={controller.selectHero}
        onAttack={controller.attackTarget}
      />

      <SkillBar
        hero={controller.selectedHero}
        selectedSkillId={controller.selectedSkillId}
        onSelectSkill={controller.selectSkill}
        onEndTurn={controller.endHeroTurn}
      />

      {livingHeroesWhoCanAct.length === 0 &&
        controller.battle.phase === "hero" && (
          <p className="turn-hint">세 캐릭터가 행동했습니다. 턴을 종료하세요.</p>
        )}

      <BattleResult
        phase={controller.battle.phase}
        onRestart={controller.restart}
      />
    </main>
  );
}
```

Replace `frontend/src/app/App.tsx` with:

```tsx
import { BattleScreen } from "../features/battle/BattleScreen";

export function App() {
  return <BattleScreen />;
}
```

- [ ] **Step 6: Verify battle interactions**

Run:

```powershell
npm test -- src/features/battle/BattleScreen.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/app frontend/src/features/battle
git commit -m "feat: add playable battle interface"
```

### Task 7: Add responsive PC and mobile-landscape styling

**Files:**
- Create: `frontend/src/features/battle/battle.css`
- Modify: `frontend/src/styles.css`
- Modify: `frontend/src/features/battle/BattleScreen.test.tsx`

- [ ] **Step 1: Add an accessibility assertion before styling**

Append to `frontend/src/features/battle/BattleScreen.test.tsx`:

```tsx
it("keeps every battle action as a named button", () => {
  render(<BattleScreen />);

  expect(
    screen.getByRole("button", { name: "전사 선택" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "아군 턴 종료" }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the accessibility test**

Run:

```powershell
npm test -- src/features/battle/BattleScreen.test.tsx
```

Expected: PASS before visual changes.

- [ ] **Step 3: Replace global styles**

Replace `frontend/src/styles.css` with:

```css
:root {
  font-family: Inter, Pretendard, system-ui, sans-serif;
  color: #f7f2dd;
  background: #08110c;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-width: 320px;
  min-height: 100%;
  margin: 0;
}

button {
  font: inherit;
}

button:focus-visible {
  outline: 3px solid #f4ca64;
  outline-offset: 3px;
}
```

Create `frontend/src/features/battle/battle.css`:

```css
.battle-screen {
  min-height: 100vh;
  padding: clamp(12px, 2vw, 28px);
  background:
    radial-gradient(circle at 50% 30%, #29452f 0 18%, transparent 42%),
    linear-gradient(#14271a, #08110c);
}

.battle-header {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(280px, 0.8fr);
  gap: 16px;
  max-width: 1180px;
  margin: 0 auto 18px;
}

.battle-header p,
.battle-header h1 {
  margin: 0;
}

.intent-panel {
  padding: 12px 16px;
  border: 2px solid #9b783d;
  background: rgb(15 22 16 / 88%);
}

.intent-panel h2 {
  margin: 0 0 8px;
  font-size: 1rem;
}

.intent-panel ul {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 20px;
}

.battlefield {
  display: grid;
  grid-template-columns: 1fr minmax(70px, 0.15fr) 1fr;
  align-items: center;
  min-height: 390px;
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(12px, 3vw, 36px);
  border: 3px solid #70552c;
  background: rgb(16 26 18 / 78%);
}

.team {
  display: grid;
  grid-template-rows: repeat(3, minmax(90px, 1fr));
  gap: 10px;
}

.lane-lines {
  height: 80%;
  background:
    linear-gradient(transparent 32%, #d4bd7a55 33% 34%, transparent 35% 65%, #d4bd7a55 66% 67%, transparent 68%);
}

.combatant-card {
  display: grid;
  grid-template-columns: 72px 1fr;
  align-items: center;
  gap: 10px;
  min-height: 88px;
  padding: 8px 12px;
  border: 2px solid #70552c;
  color: inherit;
  background: #111d15;
  cursor: pointer;
}

.combatant-card[data-selected="true"] {
  border-color: #f4ca64;
  box-shadow: 0 0 0 2px #f4ca6444;
}

.combatant-card[data-defeated="true"] {
  filter: grayscale(1);
  opacity: 0.48;
}

.combatant-sprite {
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
}

.combatant-sprite-placeholder {
  display: block;
  border: 2px solid #8e7446;
  background: #273c2c;
}

.combatant-sprite-placeholder[data-kind="warrior"] {
  background: #725225;
}

.combatant-sprite-placeholder[data-kind="archer"] {
  background: #1d6670;
}

.combatant-sprite-placeholder[data-kind="mage"] {
  background: #593277;
}

.combatant-sprite-placeholder[data-kind="rat"],
.combatant-sprite-placeholder[data-kind="slime"] {
  background: #48643a;
}

.hp-track {
  grid-column: 2;
  height: 8px;
  background: #351c18;
}

.hp-fill {
  display: block;
  height: 100%;
  background: #69a84f;
}

.skill-bar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  max-width: 1180px;
  margin: 16px auto 0;
}

.skill-list {
  display: flex;
  gap: 10px;
  min-height: 64px;
}

.skill-list button,
.end-turn,
.battle-result button {
  min-width: 120px;
  min-height: 52px;
  border: 2px solid #9b783d;
  color: inherit;
  background: #1c2c20;
}

.skill-list button[data-selected="true"] {
  border-color: #f4ca64;
}

.skill-list small {
  display: block;
}

.end-turn {
  background: #5d2b20;
}

.turn-hint {
  text-align: center;
}

.battle-result {
  position: fixed;
  inset: 50% auto auto 50%;
  translate: -50% -50%;
  min-width: min(90vw, 380px);
  padding: 28px;
  border: 3px solid #f4ca64;
  text-align: center;
  background: #101c13;
  box-shadow: 0 20px 80px #000b;
}

@media (max-width: 820px) and (orientation: landscape) {
  .battle-screen {
    padding: 8px;
  }

  .battle-header {
    grid-template-columns: 0.8fr 1.2fr;
    margin-bottom: 8px;
  }

  .battle-header h1 {
    font-size: 1.25rem;
  }

  .intent-panel {
    padding: 6px 10px;
    font-size: 0.78rem;
  }

  .battlefield {
    min-height: 245px;
    padding: 8px;
  }

  .team {
    grid-template-rows: repeat(3, 72px);
    gap: 5px;
  }

  .combatant-card {
    grid-template-columns: 48px 1fr;
    min-height: 70px;
    padding: 4px 7px;
    font-size: 0.78rem;
  }

  .combatant-sprite {
    width: 44px;
    height: 44px;
  }

  .skill-bar {
    position: sticky;
    bottom: 0;
    margin-top: 8px;
    padding: 6px;
    background: rgb(8 17 12 / 94%);
  }

  .skill-list button,
  .end-turn {
    min-width: 104px;
    min-height: 48px;
  }
}

@media (orientation: portrait) and (max-width: 820px) {
  .battle-screen::before {
    content: "전투는 모바일 가로 모드에 최적화되어 있습니다.";
    position: fixed;
    inset: 0;
    z-index: 10;
    display: grid;
    place-items: center;
    padding: 32px;
    text-align: center;
    background: #08110c;
  }
}
```

- [ ] **Step 4: Verify tests and build after CSS integration**

Run:

```powershell
npm run check
```

Expected: all tests, lint, and build pass.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/styles.css frontend/src/features/battle
git commit -m "style: add responsive battle layout"
```

### Task 8: Generate and connect the first pixel-art asset set

**Files:**
- Create: `frontend/src/assets/pixel/warrior.png`
- Create: `frontend/src/assets/pixel/archer.png`
- Create: `frontend/src/assets/pixel/mage.png`
- Create: `frontend/src/assets/pixel/rat.png`
- Create: `frontend/src/assets/pixel/slime.png`
- Create: `frontend/src/assets/pixel/goblin-forest.png`
- Create: `frontend/src/assets/pixel/sprites.ts`
- Modify: `frontend/src/features/battle/CombatantCard.tsx`
- Modify: `frontend/src/features/battle/battle.css`

- [ ] **Step 1: Generate a shared visual reference**

Use the `imagegen` skill with this prompt:

```text
Create a cohesive 16-bit fantasy pixel-art style guide sheet for a tactical
roguelike web game. Muted moss green, warm ochre, deep teal, plum magic, and
dark forest shadows. Crisp hard pixel edges, no anti-aliasing, no text, no
emoji, no modern objects. Show scale and lighting references for a warrior,
archer, mage, forest rat, moss slime, and goblin forest path.
```

Expected: one reference sheet establishes palette, proportions, light direction, and outline weight.

- [ ] **Step 2: Generate transparent combat sprites**

Generate one square transparent PNG for each of the five combatants. Reuse the reference sheet and this fixed suffix for every prompt:

```text
Side-view tactical battle sprite, facing right for heroes and facing left for
enemies, readable at 64x64 CSS pixels, transparent background, centered with
consistent ground line, crisp 16-bit pixel art, no text, no icon border, no
emoji, same palette and lighting as the supplied style reference.
```

Save the outputs with the exact filenames listed above.

- [ ] **Step 3: Generate the forest battle background**

Use:

```text
Wide 16:9 16-bit pixel-art background for a tactical battle in a goblin forest
path. Three subtle horizontal combat lanes, open readable center, darker edges
for UI contrast, mossy trees, crude goblin trail markers, no characters, no
text, no icons, no emoji, same palette and lighting as the supplied style
reference.
```

Save as `frontend/src/assets/pixel/goblin-forest.png`.

- [ ] **Step 4: Verify asset dimensions and transparency**

Create `frontend/src/assets/pixel/sprites.ts`:

```ts
import archerUrl from "./archer.png";
import mageUrl from "./mage.png";
import ratUrl from "./rat.png";
import slimeUrl from "./slime.png";
import warriorUrl from "./warrior.png";
import type { Combatant } from "../../game/model/combatant";

export const combatantSpriteUrls: Record<Combatant["kind"], string> = {
  warrior: warriorUrl,
  archer: archerUrl,
  mage: mageUrl,
  rat: ratUrl,
  slime: slimeUrl,
};
```

Replace the `.battle-screen` background declaration in
`frontend/src/features/battle/battle.css` with:

```css
.battle-screen {
  min-height: 100vh;
  padding: clamp(12px, 2vw, 28px);
  background:
    linear-gradient(rgb(4 12 8 / 55%), rgb(4 12 8 / 80%)),
    url("../../assets/pixel/goblin-forest.png") center / cover;
}
```

Replace `frontend/src/features/battle/CombatantCard.tsx` with:

```tsx
import { combatantSpriteUrls } from "../../assets/pixel/sprites";
import type { Combatant } from "../../game/model/combatant";

interface CombatantCardProps {
  combatant: Combatant;
  selected?: boolean;
  onClick?: () => void;
  actionLabel: string;
}

export function CombatantCard({
  combatant,
  selected = false,
  onClick,
  actionLabel,
}: CombatantCardProps) {
  const defeated = combatant.hp <= 0;

  return (
    <button
      className="combatant-card"
      data-selected={selected}
      data-defeated={defeated}
      disabled={defeated}
      onClick={onClick}
      aria-label={actionLabel}
    >
      <img
        src={combatantSpriteUrls[combatant.kind]}
        alt=""
        className="combatant-sprite"
      />
      <span>
        {combatant.name} · HP {combatant.hp}/{combatant.maxHp}
      </span>
      <span className="hp-track">
        <span
          className="hp-fill"
          style={{ width: `${(combatant.hp / combatant.maxHp) * 100}%` }}
        />
      </span>
    </button>
  );
}
```

Run from the repository root using the workspace image utilities available at execution time:

```powershell
Get-ChildItem frontend/src/assets/pixel/*.png | Select-Object Name,Length
```

Expected: six non-empty PNG files. Inspect each sprite visually and reject any file with text, emoji-like rendering, inconsistent facing, or a baked background.

- [ ] **Step 5: Run the production build**

Run:

```powershell
cd frontend
npm run build
```

Expected: build exits with code 0 and all six assets are included.

- [ ] **Step 6: Commit**

```powershell
git add frontend/src/assets/pixel
git commit -m "art: add chapter one pixel assets"
```

### Task 9: Run browser verification and document local development

**Files:**
- Modify: `README.md`
- Create: `docs/testing/combat-vertical-slice-checklist.md`

- [ ] **Step 1: Start the frontend**

Run from `frontend/`:

```powershell
npm run dev -- --host 0.0.0.0
```

Expected: Vite prints a localhost URL and a network URL.

- [ ] **Step 2: Verify the desktop flow in the browser**

Use the Browser skill and test this exact sequence:

1. Open the Vite localhost URL.
2. Confirm the stage heading is `1-1 숲길의 습격`.
3. Confirm all three enemy intents are visible.
4. Select 궁수 → 사격 → 숲쥐 A.
5. Confirm 숲쥐 A becomes HP 0/3 and cannot be targeted again.
6. Act with 전사 and 법사.
7. End the hero turn.
8. Confirm only living enemies attack.
9. Continue until victory.
10. Restart and confirm round, HP, intents, and event history reset.

Expected: no console errors and no interaction gets stuck.

- [ ] **Step 3: Verify mobile landscape**

Use a mobile landscape viewport near `844×390`:

1. Confirm the entire battlefield and skill bar are usable without horizontal scrolling.
2. Confirm action buttons are at least 44 CSS pixels high.
3. Confirm enemy intents remain readable.
4. Rotate to portrait and confirm the landscape guidance overlay appears.
5. Rotate back and confirm battle state remains unchanged.

Expected: the same battle remains playable with touch-sized controls.

- [ ] **Step 4: Write the manual verification checklist**

Create `docs/testing/combat-vertical-slice-checklist.md`:

```md
# Combat Vertical Slice Checklist

- [ ] Stage 1-1 loads with three heroes and three enemies.
- [ ] Enemy intent is visible before the player acts.
- [ ] Each living hero can act once per round.
- [ ] Fixed damage matches the displayed skill value.
- [ ] Defeated enemies do not act and cannot be targeted.
- [ ] Enemy turn starts only when the player presses end turn.
- [ ] Victory and defeat both show a restart action.
- [ ] Restart restores round 1, full HP, initial intents, and empty event history.
- [ ] Desktop layout has no clipped controls.
- [ ] Mobile landscape layout has no horizontal scrolling.
- [ ] Mobile portrait shows rotate guidance.
- [ ] No emoji appears in the game UI or art.
- [ ] Browser console has no errors during a full battle.
```

- [ ] **Step 5: Update README with exact frontend commands**

Add this section to `README.md`:

```md
## 로컬에서 첫 전투 실행

요구사항:

- Node.js 22.12 이상
- npm 10 이상

실행:

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

테스트와 빌드:

```powershell
cd frontend
npm run check
```

같은 Wi-Fi의 모바일에서는 Vite가 출력한 Network URL을 가로 모드로 엽니다.
```

- [ ] **Step 6: Run final verification**

Run:

```powershell
cd frontend
npm run check
```

Expected: all tests pass, lint reports no errors, and the production build exits with code 0.

- [ ] **Step 7: Commit**

```powershell
git add README.md docs/testing frontend
git commit -m "docs: verify combat vertical slice"
```

## Plan completion evidence

Before claiming this plan implemented:

1. `npm run check` must exit with code 0 in `frontend/`.
2. The desktop browser checklist must be complete.
3. The mobile-landscape checklist must be complete.
4. `git status --short` must contain no unintended files.
5. The implementation branch must contain the task commits listed above.
