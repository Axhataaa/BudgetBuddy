import { Link } from "react-router-dom";
import { LuTarget } from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function GoalRing({ percent }) {
  const offset = CIRCUMFERENCE - (Math.min(percent, 100) / 100) * CIRCUMFERENCE;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0">
      <circle cx="26" cy="26" r={RADIUS} fill="none" stroke="var(--color-surface-sunken)" strokeWidth="6" />
      <circle
        cx="26"
        cy="26"
        r={RADIUS}
        fill="none"
        stroke="var(--color-income)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }}
      />
    </svg>
  );
}

function GoalRowSkeleton() {
  return (
    <div className="d-flex align-items-center gap-3 py-2">
      <span className="placeholder-glow">
        <span className="placeholder rounded-circle" style={{ width: 52, height: 52, display: "inline-block" }} />
      </span>
      <span className="placeholder-glow flex-grow-1">
        <span className="placeholder col-6" />
      </span>
    </div>
  );
}

export default function SavingsGoals({ goals, loading }) {
  const activeGoals = (goals || []).filter((g) => !g.is_completed).slice(0, 3);

  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="font-display fs-6 fw-semibold mb-0">Savings Goals</h2>
          <p className="text-muted-ink small mb-0">
            {loading ? "Loading..." : `${activeGoals.length} active goal${activeGoals.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link to="/savings-goals" className="view-all-link small text-muted-ink">
          View all
        </Link>
      </div>

      {loading ? (
        <>
          <GoalRowSkeleton />
          <GoalRowSkeleton />
        </>
      ) : activeGoals.length === 0 ? (
        <div className="text-center py-3 border rounded" style={{ borderStyle: "dashed" }}>
          <LuTarget size={28} className="text-muted-ink mb-2" />
          <p className="text-muted-ink small mb-2">No active savings goals yet.</p>
          <Link to="/savings-goals" className="btn btn-sm btn-outline-primary">
            Add a Goal
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-1">
          {activeGoals.map((goal) => {
            const percent = Number(goal.progress_percentage) || 0;
            return (
              <Link
                key={goal.id}
                to="/savings-goals"
                className="d-flex align-items-center gap-3 py-2 transaction-item list-row-hover px-2"
              >
                <GoalRing percent={percent} />
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-medium text-truncate">{goal.goal_name}</div>
                  <div className="text-muted-ink small font-currency">
                    {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
