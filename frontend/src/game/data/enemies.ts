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
