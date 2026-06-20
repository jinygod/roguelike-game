import type { HeroCombatant } from "../model/combatant";

export const createHeroes = (): HeroCombatant[] => [
  {
    id: "warrior",
    name: "전사",
    team: "hero",
    kind: "warrior",
    hp: 12,
    maxHp: 12,
    position: { lane: 1, rank: "front" },
    skills: [
      {
        id: "slash",
        name: "베기",
        damage: 2,
        cooldown: 0,
        target: "single-enemy",
      },
    ],
    cooldowns: {},
    actedThisRound: false,
  },
  {
    id: "archer",
    name: "궁수",
    team: "hero",
    kind: "archer",
    hp: 8,
    maxHp: 8,
    position: { lane: 0, rank: "back" },
    skills: [
      {
        id: "shot",
        name: "사격",
        damage: 3,
        cooldown: 0,
        target: "single-enemy",
      },
    ],
    cooldowns: {},
    actedThisRound: false,
  },
  {
    id: "mage",
    name: "법사",
    team: "hero",
    kind: "mage",
    hp: 7,
    maxHp: 7,
    position: { lane: 2, rank: "back" },
    skills: [
      {
        id: "magic-bolt",
        name: "마력탄",
        damage: 2,
        cooldown: 0,
        target: "single-enemy",
      },
    ],
    cooldowns: {},
    actedThisRound: false,
  },
];
