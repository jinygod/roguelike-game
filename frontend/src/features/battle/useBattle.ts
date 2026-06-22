import { useMemo, useReducer, useState } from "react";
import { battleReducer } from "../../game/engine/battleReducer";
import { createStageOneBattle } from "../../game/engine/createBattle";
import { getLegalTargets } from "../../game/engine/getLegalTargets";
import type { EnemyId, HeroId } from "../../game/model/combatant";

export function useBattle() {
  const [battle, dispatch] = useReducer(
    battleReducer,
    undefined,
    createStageOneBattle,
  );
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(
    null,
  );
  const selectedHero = useMemo(
    () =>
      battle.heroes.find(
        (hero) => hero.id === battle.selectedHeroId,
      ) ?? null,
    [battle.heroes, battle.selectedHeroId],
  );

  const selectHero = (heroId: HeroId) => {
    const hero = battle.heroes.find(
      (candidate) => candidate.id === heroId,
    );

    if (
      battle.phase !== "hero" ||
      !hero ||
      hero.hp <= 0 ||
      hero.actedThisRound
    ) {
      return;
    }

    setSelectedSkillId(null);
    dispatch({ type: "select-hero", heroId });
  };

  const selectSkill = (skillId: string) => {
    const skill = selectedHero?.skills.find(
      (candidate) => candidate.id === skillId,
    );

    if (
      battle.phase !== "hero" ||
      !selectedHero ||
      selectedHero.hp <= 0 ||
      selectedHero.actedThisRound ||
      !skill ||
      selectedHero.cooldowns[skill.id] > 0
    ) {
      return;
    }

    setSelectedSkillId(skill.id);
  };

  const attackTarget = (targetId: EnemyId) => {
    const selectedSkill = selectedHero?.skills.find(
      (skill) => skill.id === selectedSkillId,
    );

    if (
      battle.phase !== "hero" ||
      !selectedHero ||
      selectedHero.hp <= 0 ||
      selectedHero.actedThisRound ||
      !selectedSkill ||
      selectedHero.cooldowns[selectedSkill.id] > 0 ||
      !getLegalTargets(battle, selectedSkill).includes(targetId)
    ) {
      return;
    }

    dispatch({
      type: "use-skill",
      actorId: selectedHero.id,
      skillId: selectedSkill.id,
      targetId,
    });
    setSelectedSkillId(null);
  };

  const endHeroTurn = () => {
    if (battle.phase !== "hero") {
      return;
    }

    setSelectedSkillId(null);
    dispatch({ type: "end-hero-turn" });
  };

  const restart = () => {
    setSelectedSkillId(null);
    dispatch({ type: "restart" });
  };

  return {
    battle,
    selectedHero,
    selectedSkillId,
    selectHero,
    selectSkill,
    attackTarget,
    endHeroTurn,
    restart,
  };
}
