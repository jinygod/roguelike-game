import type { BattleState, EnemyIntent } from "../model/battle";
import type {
  Combatant,
  EnemyCombatant,
  HeroId,
} from "../model/combatant";

function allDefeated(combatants: readonly Combatant[]): boolean {
  return combatants.every((combatant) => combatant.hp <= 0);
}

function createNextIntent(
  enemy: EnemyCombatant,
  livingHeroIds: readonly HeroId[],
  nextRound: number,
): EnemyIntent {
  const skill = enemy.skills[0];

  if (!skill) {
    throw new Error(`Missing enemy skill for ${enemy.id}`);
  }

  return {
    actorId: enemy.id,
    targetId:
      livingHeroIds[
        (nextRound + enemy.position.lane) % livingHeroIds.length
      ],
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
  const events = [...battle.events];

  for (const intent of battle.intents) {
    const actor = battle.enemies.find(
      (enemy) => enemy.id === intent.actorId,
    );
    const target = heroes.find((hero) => hero.id === intent.targetId);
    const skill = actor?.skills.find(
      (candidate) => candidate.id === intent.skillId,
    );

    if (
      !actor ||
      actor.hp <= 0 ||
      !target ||
      target.hp <= 0 ||
      !skill
    ) {
      continue;
    }

    const appliedDamage = Math.min(target.hp, skill.damage);

    heroes = heroes.map((hero) =>
      hero.id === target.id
        ? { ...hero, hp: hero.hp - appliedDamage }
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
    return {
      ...battle,
      phase: "defeat",
      heroes,
      events,
    };
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
    heroes: heroes.map((hero) => ({
      ...hero,
      cooldowns: Object.fromEntries(
        Object.entries(hero.cooldowns).map(([skillId, cooldown]) => [
          skillId,
          Math.max(0, cooldown - 1),
        ]),
      ),
      actedThisRound: false,
    })),
    intents,
    selectedHeroId: null,
    events: [
      ...events,
      {
        type: "phase-changed",
        round: nextRound,
        phase: "hero",
      },
    ],
  };
}
