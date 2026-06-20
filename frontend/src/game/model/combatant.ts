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
