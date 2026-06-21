import type { BattlePhase } from "../../game/model/battle";

interface BattleResultProps {
  phase: BattlePhase;
  onRestart: () => void;
}

export function BattleResult({
  phase,
  onRestart,
}: BattleResultProps) {
  if (phase !== "victory" && phase !== "defeat") {
    return null;
  }

  const heading =
    phase === "victory" ? "전투 승리" : "파티 전멸";

  return (
    <section
      className="battle-result"
      role="dialog"
      aria-modal="true"
      aria-labelledby="battle-result-heading"
    >
      <h2 id="battle-result-heading">{heading}</h2>
      <button type="button" onClick={onRestart}>
        1-1 다시 시작
      </button>
    </section>
  );
}
