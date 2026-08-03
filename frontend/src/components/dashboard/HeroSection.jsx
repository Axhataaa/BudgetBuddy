import FinancialHealth from "./FinancialHealth";
import { formatCurrency } from "../../utils/formatCurrency";

export default function HeroSection({ summary, periodLabel, loading }) {
  if (loading || !summary) {
    return (
      <div className="finance-hero mb-3">
        <div className="placeholder-glow">
          <span className="placeholder col-4 mb-3" style={{ height: 12 }} />
          <span className="placeholder col-6 d-block mb-3" style={{ height: 40 }} />
          <span className="placeholder col-8" style={{ height: 14 }} />
        </div>
      </div>
    );
  }

  const netSavings = Number(summary.net_savings) || 0;
  const isPositive = netSavings >= 0;

  // Part 2 fix: this used to read summary.current_balance, which is
  // month-scoped (identical formula to net_savings) - picking an
  // empty month made a user's balance look like literally zero.
  // summary.lifetime.current_balance never resets month to month.
  const lifetimeBalance = Number(summary.lifetime?.current_balance) || 0;

  const hasBudgets = Number(summary.total_budget) > 0;
  const overspent = summary.budget_status?.overspent_categories || 0;
  const warning = summary.budget_status?.warning_categories || 0;

  let budgetChip = { tone: "warn", text: "No budget set for this period" };
  if (hasBudgets) {
    if (overspent > 0) {
      budgetChip = {
        tone: "bad",
        text: `${overspent} categor${overspent === 1 ? "y" : "ies"} over budget`,
      };
    } else if (warning > 0) {
      budgetChip = {
        tone: "warn",
        text: `${warning} categor${warning === 1 ? "y" : "ies"} nearing limit`,
      };
    } else {
      budgetChip = { tone: "good", text: "Budget on track" };
    }
  }

  const activeGoals = Number(summary.active_goals) || 0;
  const completedGoals = Number(summary.completed_goals) || 0;
  let goalsChip = { tone: "warn", text: "No savings goals yet" };
  if (activeGoals > 0) {
    goalsChip = {
      tone: "good",
      text: `${activeGoals} goal${activeGoals === 1 ? "" : "s"} in progress`,
    };
  } else if (completedGoals > 0) {
    goalsChip = {
      tone: "good",
      text: `${completedGoals} goal${completedGoals === 1 ? "" : "s"} completed`,
    };
  }

  return (
    <div className="finance-hero mb-3">
      <svg
        className="coin-ring"
        width="100%"
        height="100%"
        viewBox="0 0 600 220"
        preserveAspectRatio="xMaxYMin slice"
        aria-hidden="true"
      >
        <circle cx="540" cy="28" r="70" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.5" />
        <circle cx="540" cy="28" r="52" fill="none" stroke="var(--color-accent)" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
        <circle cx="592" cy="128" r="44" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.35" />
      </svg>

      <div className="row align-items-center g-4 position-relative">
        <div className="col-lg-7">
          <div className="finance-hero-eyebrow">Overall financial position</div>
          <div className="finance-hero-balance font-currency">
            {formatCurrency(lifetimeBalance)}
          </div>

          {/* Issue 3: was a prose sentence ("You're saving X this
              period...") duplicating what the "Cash flow
              positive/negative" chip below already signals. This
              compact block keeps monthly performance visible right
              under the primary (lifetime) balance without a second
              hero or a full card - exactly the requested layout. */}
          <div className="finance-hero-monthly">
            <div className="finance-hero-monthly-label">
              This Month &middot; Net Savings ({periodLabel})
            </div>
            <div
              className="finance-hero-monthly-value"
              style={{ color: isPositive ? "#7FE0AE" : "#F0897E" }}
            >
              {formatCurrency(netSavings)}
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            <span className={`hero-chip ${isPositive ? "good" : "bad"}`}>
              {isPositive ? "▲" : "▼"} {isPositive ? "Cash flow positive" : "Cash flow negative"}
            </span>
            <span className={`hero-chip ${budgetChip.tone}`}>● {budgetChip.text}</span>
            <span className={`hero-chip ${goalsChip.tone}`}>★ {goalsChip.text}</span>
          </div>
        </div>

        <div className="col-lg-5">
          <FinancialHealth summary={summary} />
        </div>
      </div>
    </div>
  );
}
