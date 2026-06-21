import { stageOne } from "../../game/data/stages";
import { getLegalTargets } from "../../game/engine/getLegalTargets";
import { BattleResult } from "./BattleResult";
import { Battlefield } from "./Battlefield";
import { IntentPanel } from "./IntentPanel";
import { SkillBar } from "./SkillBar";
import { useBattle } from "./useBattle";

export function BattleScreen() {
  const controller = useBattle();
  const hasLivingHeroWhoCanAct = controller.battle.heroes.some(
    (hero) => hero.hp > 0 && !hero.actedThisRound,
  );
  const selectedSkill =
    controller.battle.phase === "hero"
      ? controller.selectedHero?.skills.find(
          (skill) => skill.id === controller.selectedSkillId,
        )
      : undefined;
  const legalTargetIds = selectedSkill
    ? getLegalTargets(controller.battle, selectedSkill)
    : [];

  return (
    <main className="battle-screen">
      <div className="battle-topbar">
        <header className="stage-panel">
          <p className="stage-chapter">챕터 1</p>
          <h1>
            {stageOne.id} {stageOne.name}
          </h1>
          <p className="stage-round">
            라운드 {controller.battle.round}
          </p>
        </header>

        <IntentPanel battle={controller.battle} />
      </div>

      <Battlefield
        battle={controller.battle}
        selectedHeroId={controller.selectedHero?.id ?? null}
        legalTargetIds={legalTargetIds}
        onSelectHero={controller.selectHero}
        onAttack={controller.attackTarget}
      />

      {controller.battle.phase === "hero" &&
      !hasLivingHeroWhoCanAct ? (
        <p className="turn-hint">
          행동 가능한 아군이 없습니다. 턴을 종료하세요.
        </p>
      ) : null}

      <SkillBar
        hero={controller.selectedHero}
        phase={controller.battle.phase}
        selectedSkillId={controller.selectedSkillId}
        onSelectSkill={controller.selectSkill}
        onEndTurn={controller.endHeroTurn}
      />

      <BattleResult
        phase={controller.battle.phase}
        onRestart={controller.restart}
      />
    </main>
  );
}
