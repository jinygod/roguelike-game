import type { BattleState } from "../model/battle";
import type { EnemyId, HeroId } from "../model/combatant";
import { getLegalTargets } from "./getLegalTargets";

export interface HeroAction {
  actorId: HeroId;
  skillId: string;
  targetId: EnemyId;
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

  const skill = actor.skills.find(
    (candidate) => candidate.id === action.skillId,
  );

  if (!skill) {
    throw new Error("존재하지 않는 스킬입니다.");
  }

  if (actor.cooldowns[skill.id] > 0) {
    throw new Error("아직 사용할 수 없는 스킬입니다.");
  }

  if (!getLegalTargets(battle, skill).includes(action.targetId)) {
    throw new Error("쓰러진 대상은 선택할 수 없습니다.");
  }

  const target = battle.enemies.find(
    (enemy) => enemy.id === action.targetId,
  );

  if (!target) {
    throw new Error("쓰러진 대상은 선택할 수 없습니다.");
  }

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
