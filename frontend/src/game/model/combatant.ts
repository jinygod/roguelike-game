export type Team = "hero" | "enemy";
export type Lane = 0 | 1 | 2;
export type Rank = "front" | "back";
export type HeroId = "warrior" | "archer" | "mage";
export type EnemyId = "rat-a" | "rat-b" | "slime";
export type EnemyKind = "rat" | "slime";
export type CombatantId = HeroId | EnemyId;

export interface Position {
  lane: Lane;
  rank: Rank;
}

export interface SkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly damage: number;
  readonly cooldown: number;
  readonly target: "single-enemy" | "same-lane-enemies";
}

interface CombatantFields {
  name: string;
  hp: number;
  maxHp: number;
  position: Position;
  skills: readonly SkillDefinition[];
  cooldowns: Record<string, number>;
  actedThisRound: boolean;
}

export type HeroCombatant = {
  [Id in HeroId]: CombatantFields & {
    id: Id;
    team: "hero";
    kind: Id;
  };
}[HeroId];

export type EnemyCombatant =
  | (CombatantFields & {
      id: "rat-a" | "rat-b";
      team: "enemy";
      kind: "rat";
    })
  | (CombatantFields & {
      id: "slime";
      team: "enemy";
      kind: "slime";
    });

export type Combatant = HeroCombatant | EnemyCombatant;
