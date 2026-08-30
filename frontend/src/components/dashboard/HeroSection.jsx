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

  const savingTarget = Number(summary.monthly_saving_target) || 0;
  const hasSavingTarget = savingTarget > 0;

  const targetAchievedPercent = hasSavingTarget && netSavings > 0
    ? Math.round((netSavings / savingTarget) * 100)
    : 0;
  const targetProgressPercent = Math.min(Math.max(targetAchievedPercent, 0), 100);

  let targetCaption = "";
  if (hasSavingTarget) {
    if (netSavings <= 0) {
      targetCaption = `${formatCurrency(savingTarget - netSavings)} below target`;
    } else if (targetAchievedPercent >= 100) {
      const above = netSavings - savingTarget;
      targetCaption = above > 0 ? `${formatCurrency(above)} above target` : "Target reached";
    } else {
      targetCaption = `${formatCurrency(savingTarget - netSavings)} to go`;
    }
  }

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

          {}
          
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

            <div className="finance-hero-target">
              <div className="d-flex justify-content-between align-items-baseline">
                <span className="finance-hero-target-label">Monthly saving target</span>
                {hasSavingTarget && (
                  <span
                    className="finance-hero-target-percent"
                    style={{ color: targetAchievedPercent >= 100 ? "#7FE0AE" : "rgba(255,255,255,0.85)" }}
                  >
                    {targetAchievedPercent}% achieved
                  </span>
                )}
              </div>

              {hasSavingTarget ? (
                <>
                  <div className="finance-hero-target-value font-currency">
                    {formatCurrency(savingTarget)}
                  </div>
                  <div className="progress finance-hero-target-track">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      aria-valuenow={targetProgressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      style={{ width: `${targetProgressPercent}%`, backgroundColor: "var(--color-accent)" }}
                    />
                  </div>
                  <div className="finance-hero-target-caption">{targetCaption}</div>
                </>
              ) : (
                <div className="finance-hero-target-caption">No monthly target set</div>
              )}
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
