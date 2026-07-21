import { Link } from "react-router-dom";
import { LuCircleArrowDown } from "react-icons/lu";
import ExpensePieChart from "./ExpensePieChart";

export default function SpendingTrends({ summary, loading, periodLabel, highestCategory }) {
  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-1">
        <div>
          <h2 className="font-display fs-6 fw-semibold mb-0">Spending Trends</h2>
          <p className="text-muted-ink small mb-0">Where your money went this period</p>
        </div>
        {highestCategory && (
          <span className="badge bg-surface-sunken text-ink">Top: {highestCategory.category}</span>
        )}
      </div>

      {loading ? (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-3">
              <span className="placeholder-glow d-block mb-1">
                <span className="placeholder col-5" />
              </span>
              <span className="placeholder-glow d-block">
                <span className="placeholder col-12" style={{ height: 6 }} />
              </span>
            </div>
          ))}
        </>
      ) : !summary?.expense_by_category?.length ? (
        <div className="text-center py-4">
          <LuCircleArrowDown size={34} className="text-muted-ink mb-2" />
          <p className="text-muted-ink mb-2">No expenses recorded for {periodLabel}.</p>
          <Link to="/expenses" className="btn btn-sm btn-outline-primary">
            Add Expense
          </Link>
        </div>
      ) : (
        <ExpensePieChart data={summary.expense_by_category} />
      )}
    </div>
  );
}
