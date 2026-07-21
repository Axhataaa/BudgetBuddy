import { LuTriangleAlert, LuPiggyBank, LuFolderOpen, LuSparkles } from "react-icons/lu";
import EmptyState from "../ui/EmptyState";

function buildInsights(summary) {
  if (!summary) return [];
  const insights = [];
  const utilization = summary.budget_utilization || [];

  const overBudget = utilization
    .filter((b) => b.percent_used >= 100)
    .sort((a, b) => b.percent_used - a.percent_used);
  const nearLimit = utilization
    .filter((b) => b.percent_used >= 90 && b.percent_used < 100)
    .sort((a, b) => b.percent_used - a.percent_used);

  if (overBudget.length) {
    const worst = overBudget[0];
    insights.push({
      tone: "bad",
      icon: LuTriangleAlert,
      text: (
        <>
          Your <strong>{worst.category}</strong> budget is {worst.percent_used.toFixed(0)}% used —
          you've gone over the limit.
        </>
      ),
    });
  } else if (nearLimit.length) {
    const worst = nearLimit[0];
    insights.push({
      tone: "warn",
      icon: LuTriangleAlert,
      text: (
        <>
          Your <strong>{worst.category}</strong> budget is {worst.percent_used.toFixed(0)}% used,
          close to the limit.
        </>
      ),
    });
  }

  if (Number(summary.total_income) > 0) {
    const rate = Number(summary.savings_rate) || 0;
    insights.push({
      tone: rate >= 0 ? "good" : "bad",
      icon: LuPiggyBank,
      text: (
        <>
          You've saved <strong>{rate.toFixed(1)}%</strong> of your income this period.
        </>
      ),
    });
  }

  if (Number(summary.total_budget) === 0) {
    insights.push({
      tone: "warn",
      icon: LuFolderOpen,
      text: <>No budgets set for this period yet — set one to track spending limits.</>,
    });
  }

  return insights.slice(0, 3);
}

const TONE_CLASSES = {
  good: "bg-success-subtle text-success",
  warn: "bg-warning-subtle text-warning",
  bad: "bg-danger-subtle text-danger",
};

export default function SmartInsights({ summary, loading }) {
  const insights = buildInsights(summary);

  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
      <h2 className="font-display fs-6 fw-semibold mb-0">Smart Insights</h2>
      <p className="text-muted-ink small mb-3">Based on this period's activity</p>

      {loading ? (
        Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="d-flex align-items-center gap-3 py-2">
            <span className="placeholder-glow">
              <span className="placeholder rounded" style={{ width: 32, height: 32, display: "inline-block" }} />
            </span>
            <span className="placeholder-glow flex-grow-1">
              <span className="placeholder col-8" />
            </span>
          </div>
        ))
      ) : insights.length === 0 ? (
        <EmptyState
          icon={LuSparkles}
          message="Insights will appear here once there's some activity to learn from."
        />
      ) : (
        insights.map((insight, i) => (
          <div key={i} className="insight-row">
            <span className={`insight-icon ${TONE_CLASSES[insight.tone]}`}>
              <insight.icon size={16} />
            </span>
            <div className="small">{insight.text}</div>
          </div>
        ))
      )}
    </div>
  );
}
