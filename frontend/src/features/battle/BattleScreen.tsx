import { useEffect, useRef, useState } from "react";
import { stageOne } from "../../game/data/stages";
import { getLegalTargets } from "../../game/engine/getLegalTargets";
import { BattleResult } from "./BattleResult";
import { Battlefield } from "./Battlefield";
import { IntentPanel } from "./IntentPanel";
import { SkillBar } from "./SkillBar";
import { useBattle } from "./useBattle";
import "./battle.css";

const portraitMediaQuery =
  "(orientation: portrait) and (max-width: 820px)";
const portraitGuidance =
  "전투는 모바일 가로 모드에 최적화되어 있습니다.";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia(query).matches,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener("change", handleChange);

    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

export function BattleScreen() {
  const controller = useBattle();
  const isPortrait = useMediaQuery(portraitMediaQuery);
  const orientationGuardRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (isPortrait) {
      orientationGuardRef.current?.focus();
    }
  }, [isPortrait]);

  return (
    <main className="battle-screen">
      <div
        className="battle-game"
        inert={isPortrait ? true : undefined}
        aria-hidden={isPortrait ? true : undefined}
      >
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

        <div className="battle-main">
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
        </div>

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
      </div>

      {isPortrait ? (
        <div
          ref={orientationGuardRef}
          className="orientation-guard"
          role="dialog"
          aria-modal="true"
          aria-label={portraitGuidance}
          tabIndex={0}
        >
          {portraitGuidance}
        </div>
      ) : null}
    </main>
  );
}
