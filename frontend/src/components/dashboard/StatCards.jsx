import {
  LuTrendingUp,
  LuTrendingDown,
  LuPiggyBank,
  LuTarget,
  LuAward,
  LuFolderOpen,
} from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";

export function StatCard({
  label,
  amount,
  subtitle,
  colorClass,
  icon: Icon,
  onClick,
  clickable = false,
  isCurrency = true,
}) {
  return (
    <div className="col-6 col-md-3">
      <div
        className={`stat-card bg-surface rounded shadow-token-sm hover-card p-3 h-100 ${
          clickable ? "cursor-pointer" : ""
        }`}
        onClick={onClick}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={(e) => {
          if (clickable && (e.key === "Enter" || e.key === " ")) {
            onClick?.();
          }
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className={`stat-card-icon bg-surface-sunken ${colorClass}`}>
            <Icon size={16} />
          </span>
        </div>
        <div className="text-muted-ink small mb-1">{label}</div>
        <div className={`fs-5 fw-medium ${colorClass}`}>
          {amount === null ? (
            <span className="text-muted-ink fs-6">—</span>
          ) : isCurrency ? (
            <span className="font-currency">{formatCurrency(amount)}</span>
          ) : (
            amount
          )}
        </div>
        {subtitle && <div className="text-muted-ink small mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="col-6 col-md-3">
      <div className="stat-card bg-surface rounded shadow-token-sm hover-card p-3">
        <span className="placeholder-glow d-block mb-2">
          <span className="placeholder col-6" />
        </span>
        <span className="placeholder-glow d-block">
          <span className="placeholder col-8" style={{ height: 24 }} />
        </span>
      </div>
    </div>
  );
}

export default function StatCards({ summary, loading, hasBudgetData, budgetRemaining, overallBudgetPercent, navigate }) {
  if (loading || !summary) {
    return (
      <div className="row g-3 mb-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="row g-3 mb-3">
        <StatCard
          label="Total Income"
          amount={summary.total_income}
          subtitle="This period"
          colorClass="text-income"
          icon={LuTrendingUp}
          clickable
          onClick={() => navigate("/income")}
        />
        <StatCard
          label="Total Expenses"
          amount={summary.total_expenses}
          subtitle="This period"
          colorClass="text-expense"
          icon={LuTrendingDown}
          clickable
          onClick={() => navigate("/expenses")}
        />
        <StatCard
          label="Savings Rate"
          amount={`${Number(summary.savings_rate).toFixed(1)}%`}
          isCurrency={false}
          subtitle={
            Number(summary.net_savings) >= 0 ? "You're in the green" : "Spending exceeds income"
          }
          colorClass={Number(summary.net_savings) >= 0 ? "text-income" : "text-expense"}
          icon={LuTarget}
        />
        <StatCard
          label="Budget Remaining"
          amount={hasBudgetData ? budgetRemaining : null}
          subtitle={hasBudgetData ? `${overallBudgetPercent.toFixed(0)}% of budget used` : "No budgets set"}
          colorClass={hasBudgetData && budgetRemaining < 0 ? "text-expense" : "text-ink"}
          icon={LuFolderOpen}
          clickable
          onClick={() => navigate("/budgets")}
        />
      </div>

      <div className="row g-3 mb-3">
        <StatCard
          label="Total Savings"
          amount={summary.total_savings}
          subtitle="Across active goals"
          colorClass="text-income"
          icon={LuPiggyBank}
          clickable
          onClick={() => navigate("/savings-goals")}
        />
        <StatCard
          label="Active Goals"
          amount={summary.active_goals}
          isCurrency={false}
          subtitle="Currently in progress"
          colorClass="text-primary"
          icon={LuTarget}
          clickable
          onClick={() => navigate("/savings-goals")}
        />
        <StatCard
          label="Achievements"
          amount={summary.achievements}
          isCurrency={false}
          subtitle="Goals successfully completed"
          colorClass="text-warning"
          icon={LuAward}
          clickable
          onClick={() => navigate("/achievements")}
        />
        <StatCard
          label="Budgets Created"
          amount={summary.budgets_created}
          isCurrency={false}
          subtitle="Monthly budgets"
          colorClass="text-info"
          icon={LuFolderOpen}
          clickable
          onClick={() => navigate("/budgets")}
        />
      </div>
    </>
  );
}
