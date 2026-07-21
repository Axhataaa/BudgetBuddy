import { useEffect, useState } from "react";
import { getFinancialHealth } from "../../utils/financialHealth";

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FinancialHealth({ summary }) {
  const { score, label } = getFinancialHealth(summary);
  const [animated, setAnimated] = useState(false);

  // Animate the ring in on mount / whenever the score changes, rather
  // than snapping straight to its final position.
  useEffect(() => {
    setAnimated(false);
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const offset = animated
    ? CIRCUMFERENCE - (Math.min(score, 100) / 100) * CIRCUMFERENCE
    : CIRCUMFERENCE;

  return (
    <div className="d-flex align-items-center gap-3 justify-content-lg-end">
      <svg width="88" height="88" viewBox="0 0 88 88" className="flex-shrink-0">
        <circle
          cx="44"
          cy="44"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,.14)"
          strokeWidth="8"
        />
        <circle
          cx="44"
          cy="44"
          r={RADIUS}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }}
        />
        <text
          x="44"
          y="50"
          textAnchor="middle"
          fill="#fff"
          fontFamily="var(--font-display)"
          fontSize="20"
          fontWeight="600"
        >
          {score}
        </text>
      </svg>
      <div className="text-lg-end">
        <div className="health-ring-label text-white">{label}</div>
        <div className="health-ring-caption">
          Financial health score, based on your savings rate, budget
          discipline and goal progress this period.
        </div>
      </div>
    </div>
  );
}
