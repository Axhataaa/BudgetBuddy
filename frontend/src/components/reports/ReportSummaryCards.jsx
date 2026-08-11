import { LuTrendingUp, LuTrendingDown, LuWallet, LuTarget } from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";

const CARD_CONFIG = {
  income: { tint: "rgba(31, 157, 108, 0.08)", colorClass: "text-income" },
  expense: { tint: "rgba(214, 69, 69, 0.08)", colorClass: "text-expense" },
  primary: { tint: "rgba(48, 59, 142, 0.08)", colorClass: "text-primary" },
};

function ReportStatCard({ label, value, subtitle, icon: Icon, tone }) {
  const { tint, colorClass } = CARD_CONFIG[tone];

  return (
    <div className="col-6 col-md-3">
      <div
        className="bg-surface rounded shadow-token-sm hover-card p-3 h-100 position-relative overflow-hidden"
        style={{ borderTop: `3px solid ${tint.replace("0.08", "1")}` }}
      >
        <span
          className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-2 ${colorClass}`}
          style={{ width: 40, height: 40, backgroundColor: tint }}
        >
          <Icon size={18} />
        </span>
        <div className="text-muted-ink small mb-1">{label}</div>
        <div className={`fs-4 fw-semibold ${colorClass}`}>
          <span className="font-currency">{value}</span>
        </div>
        {subtitle && <div className="text-muted-ink small mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function ReportSummaryCards({ summary, loading }) {
  if (loading || !summary) {
    return (
      <div className="row g-3 mb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="col-6 col-md-3" key={i}>
            <div className="bg-surface rounded shadow-token-sm p-3 h-100">
              <span className="placeholder-glow d-block mb-2">
                <span className="placeholder col-6" style={{ height: 40, borderRadius: "50%", width: 40, display: "inline-block" }} />
              </span>
              <span className="placeholder-glow d-block">
                <span className="placeholder col-8" style={{ height: 24 }} />
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isPositive = Number(summary.net_savings) >= 0;
  const balancePositive = Number(summary.current_balance) >= 0;

  return (
    <div className="row g-3 mb-3">
      <ReportStatCard
        label="Income"
        value={formatCurrency(summary.total_income)}
        subtitle="Total for this period"
        icon={LuTrendingUp}
        tone="income"
      />
      <ReportStatCard
        label="Expenses"
        value={formatCurrency(summary.total_expenses)}
        subtitle="Total for this period"
        icon={LuTrendingDown}
        tone="expense"
      />
      <ReportStatCard
        label="Current Balance"
        value={formatCurrency(summary.current_balance)}
        subtitle={balancePositive ? "You're in the green" : "Spending exceeds income"}
        icon={LuWallet}
        tone={balancePositive ? "income" : "expense"}
      />
      <ReportStatCard
        label="Savings Rate"
        value={`${Number(summary.savings_rate).toFixed(1)}%`}
        subtitle={
          Number(summary.total_income) === 0
            ? "No income recorded"
            : isPositive
              ? "Of income saved"
              : "Spending exceeds income"
        }
        icon={LuTarget}
        tone={Number(summary.total_income) === 0 ? "primary" : isPositive ? "income" : "expense"}
      />
    </div>
  );
}
