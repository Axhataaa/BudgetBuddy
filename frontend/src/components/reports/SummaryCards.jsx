import { LuTrendingUp, LuTrendingDown, LuWallet, LuPiggyBank, LuTarget } from "react-icons/lu";
import { StatCard, StatCardSkeleton } from "../dashboard/StatCards";

export default function SummaryCards({ summary, loading }) {
  if (loading || !summary) {
    return (
      <div className="row g-3 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const isPositive = Number(summary.net_savings) >= 0;

  return (
    <div className="row g-3 mb-3">
      <StatCard label="Income" amount={summary.total_income} colorClass="text-income" icon={LuTrendingUp} />
      <StatCard label="Expenses" amount={summary.total_expenses} colorClass="text-expense" icon={LuTrendingDown} />
      <StatCard
        label="Net Savings"
        amount={summary.net_savings}
        colorClass={isPositive ? "text-income" : "text-expense"}
        icon={LuPiggyBank}
      />
      <StatCard
        label="Balance"
        amount={summary.current_balance}
        colorClass={Number(summary.current_balance) >= 0 ? "text-income" : "text-expense"}
        icon={LuWallet}
      />
      <StatCard
        label="Savings Rate"
        amount={`${Number(summary.savings_rate).toFixed(1)}%`}
        isCurrency={false}
        colorClass={isPositive ? "text-income" : "text-expense"}
        icon={LuTarget}
      />
    </div>
  );
}
