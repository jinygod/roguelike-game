import type { Combatant } from "../../game/model/combatant";
import archerUrl from "./archer.png";
import mageUrl from "./mage.png";
import ratUrl from "./rat.png";
import slimeUrl from "./slime.png";
import warriorUrl from "./warrior.png";

export const combatantSpriteUrls: Record<Combatant["kind"], string> = {
  warrior: warriorUrl,
  archer: archerUrl,
  mage: mageUrl,
  rat: ratUrl,
  slime: slimeUrl,
};
