import { useEffect, useRef } from "react";
import type { BattlePhase } from "../../game/model/battle";

interface BattleResultProps {
  phase: BattlePhase;
  onRestart: () => void;
}

export function BattleResult({
  phase,
  onRestart,
}: BattleResultProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hasResult = phase === "victory" || phase === "defeat";

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || !hasResult) {
      return;
    }

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    return () => {
      if (typeof dialog.close === "function" && dialog.open) {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    };
  }, [hasResult, phase]);

  if (!hasResult) {
    return null;
  }

  const heading =
    phase === "victory" ? "전투 승리" : "파티 전멸";

  return (
    <dialog
      ref={dialogRef}
      className="battle-result"
      aria-labelledby="battle-result-heading"
    >
      <h2 id="battle-result-heading">{heading}</h2>
      <button type="button" onClick={onRestart} autoFocus>
        1-1 다시 시작
      </button>
    </dialog>
  );
}
