import { LuTrendingUp, LuReceipt, LuCalendarDays, LuSparkles } from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";
import EmptyState from "../ui/EmptyState";

export default function FinancialInsights({ insights, loading }) {
  if (loading) {
    return Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="d-flex align-items-center gap-3 py-2">
        <span className="placeholder-glow">
          <span className="placeholder rounded" style={{ width: 32, height: 32, display: "inline-block" }} />
        </span>
        <span className="placeholder-glow flex-grow-1">
          <span className="placeholder col-8" />
        </span>
      </div>
    ));
  }

  const rows = [];

  if (insights?.highest_spending_category) {
    const cat = insights.highest_spending_category;
    rows.push({
      icon: LuTrendingUp,
      tone: "bg-danger-subtle text-danger",
      text: (
        <>
          Highest spending category: <strong>{cat.category}</strong> at {formatCurrency(cat.total)}.
        </>
      ),
    });
  }

  if (insights?.largest_expense) {
    const exp = insights.largest_expense;
    rows.push({
      icon: LuReceipt,
      tone: "bg-warning-subtle text-warning",
      text: (
        <>
          Largest single expense: <strong>{exp.title}</strong> for {formatCurrency(exp.amount)} on{" "}
          {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.
        </>
      ),
    });
  }

  if (insights && Number(insights.average_daily_spending) > 0) {
    rows.push({
      icon: LuCalendarDays,
      tone: "bg-info-subtle text-info",
      text: (
        <>
          Average daily spending: <strong>{formatCurrency(insights.average_daily_spending)}</strong>.
        </>
      ),
    });
  }

  if (insights?.best_saving_period) {
    const best = insights.best_saving_period;
    const label =
      best.granularity === "month"
        ? new Date(`${best.period}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
        : new Date(best.period).toLocaleDateString("en-IN", { day: "numeric", month: "long" });
    rows.push({
      icon: LuSparkles,
      tone: "bg-success-subtle text-success",
      text: (
        <>
          Best saving {best.granularity === "month" ? "month" : "day"}: <strong>{label}</strong>, saved{" "}
          {formatCurrency(best.net_savings)}.
        </>
      ),
    });
  }

  if (!rows.length) {
    return (
      <EmptyState
        icon={LuSparkles}
        message="Insights will appear here once there's some activity in this date range."
      />
    );
  }

  return rows.map((row, i) => (
    <div key={i} className="insight-row">
      <span className={`insight-icon ${row.tone}`}>
        <row.icon size={16} />
      </span>
      <div className="small">{row.text}</div>
    </div>
  ));
}
