import { LuFolderOpen } from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";
import { getBudgetStatusColor } from "../../utils/budgetStatus";
import EmptyState from "../ui/EmptyState";

export default function BudgetPerformance({ budgetPerformance, loading }) {
  if (loading) {
    return (
      <div className="row g-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="col-6 col-md-4">
            <span className="placeholder-glow d-block mb-1">
              <span className="placeholder col-6" />
            </span>
            <span className="placeholder-glow d-block">
              <span className="placeholder col-12" style={{ height: 6 }} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (!budgetPerformance?.length) {
    return (
      <EmptyState
        icon={LuFolderOpen}
        message="No budgets were set for any category in this date range."
      />
    );
  }

  return (
    <div className="row g-3">
      {budgetPerformance.map((b) => (
        <div key={b.category} className="col-6 col-md-4">
          <div className="d-flex justify-content-between small mb-1">
            <span className="fw-medium">{b.category}</span>
            <span className="font-currency text-muted-ink">
              {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
            </span>
          </div>
          <div className="progress" style={{ height: 6 }}>
            <div
              className="progress-bar"
              style={{
                width: `${Math.min(b.percent_used, 100)}%`,
                backgroundColor: getBudgetStatusColor(b.percent_used),
              }}
            />
          </div>
          <div className="text-muted-ink small mt-1">{b.percent_used.toFixed(0)}% used</div>
        </div>
      ))}
    </div>
  );
}
