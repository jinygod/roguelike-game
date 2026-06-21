import type { BattleState } from "../../game/model/battle";
import type {
  EnemyId,
  HeroId,
  Position,
} from "../../game/model/combatant";
import { CombatantCard } from "./CombatantCard";

interface BattlefieldProps {
  battle: BattleState;
  selectedHeroId: HeroId | null;
  canAttack: boolean;
  onSelectHero: (heroId: HeroId) => void;
  onAttack: (enemyId: EnemyId) => void;
}

function comparePositions(
  left: { position: Position },
  right: { position: Position },
) {
  const laneDifference = left.position.lane - right.position.lane;

  if (laneDifference !== 0) {
    return laneDifference;
  }

  return left.position.rank === right.position.rank
    ? 0
    : left.position.rank === "front"
      ? -1
      : 1;
}

export function Battlefield({
  battle,
  selectedHeroId,
  canAttack,
  onSelectHero,
  onAttack,
}: BattlefieldProps) {
  const heroes = battle.heroes.toSorted(comparePositions);
  const enemies = battle.enemies.toSorted(comparePositions);

  return (
    <section className="battlefield" aria-label="전장">
      <div
        className="battlefield-team battlefield-heroes"
        aria-label="아군"
      >
        {heroes.map((hero) => {
          const canSelect =
            battle.phase === "hero" &&
            hero.hp > 0 &&
            !hero.actedThisRound;

          return (
            <div
              key={hero.id}
              className="battlefield-slot"
              data-lane={hero.position.lane}
              data-rank={hero.position.rank}
            >
              <CombatantCard
                combatant={hero}
                selected={hero.id === selectedHeroId}
                onClick={
                  canSelect ? () => onSelectHero(hero.id) : undefined
                }
                actionLabel={`${hero.name} 선택`}
              />
            </div>
          );
        })}
      </div>

      <div className="battlefield-lanes" aria-hidden="true" />

      <div
        className="battlefield-team battlefield-enemies"
        aria-label="적군"
      >
        {enemies.map((enemy) => {
          const canTarget = canAttack && enemy.hp > 0;

          return (
            <div
              key={enemy.id}
              className="battlefield-slot"
              data-lane={enemy.position.lane}
              data-rank={enemy.position.rank}
            >
              <CombatantCard
                combatant={enemy}
                onClick={
                  canTarget ? () => onAttack(enemy.id) : undefined
                }
                actionLabel={`${enemy.name} 공격`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
