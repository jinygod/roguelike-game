import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BattleScreen } from "./BattleScreen";

type BattleUser = ReturnType<typeof userEvent.setup>;

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

describe("BattleScreen", () => {
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

  it("shows defeat after enemy attacks eliminate the party", async () => {
    const user = setupBattle();

    for (let turn = 0; turn < 7; turn += 1) {
      await endTurn(user);
    }

    expect(
      screen.getByRole("dialog", { name: "파티 전멸" }),
    ).toBeInTheDocument();
  });
});
