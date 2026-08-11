import { formatCurrency } from "../../utils/formatCurrency";
import { getBudgetStatusColor } from "../../utils/budgetStatus";
import { getExpenseCategoryMeta } from "../../pages/Expenses/expenseConstants";

export default function BudgetProgress({ summary, loading, hasBudgetData, overallBudgetPercent }) {
  if (loading || !hasBudgetData) return null;

  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-3 mb-3">
      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-1">
        <div>
          <h2 className="font-display fs-6 fw-semibold mb-1">Budget Progress</h2>
          <p className="text-muted-ink small mb-0">
            Monitor how much of each budget you've used this month.
          </p>
        </div>
        <span className="small text-muted-ink">
          {overallBudgetPercent.toFixed(0)}% of total budget used
        </span>
      </div>

      <div className="row g-3">
        {summary.budget_utilization.map((b) => {
          // Same EXPENSE_CATEGORY_META Budgets/Reports already use -
          // one category, one icon/tint, everywhere it shows up.
          const meta = getExpenseCategoryMeta(b.category);
          const CategoryIcon = meta.icon;
          return (
            <div key={b.category} className="col-6 col-md-4">
              <div className="d-flex justify-content-between align-items-center small mb-1">
                <span className="d-flex align-items-center gap-2">
                  <span className={`category-icon ${meta.badge}`} style={{ width: 26, height: 26 }}>
                    <CategoryIcon size={13} />
                  </span>
                  <span className="text-ink">{b.category}</span>
                </span>
                <span className="font-currency text-muted-ink">
                  {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                </span>
              </div>
              <div className="progress progress-track" style={{ height: 6 }}>
                <div
                  className="progress-bar"
                  style={{
                    width: `${Math.min(b.percent_used, 100)}%`,
                    backgroundColor: getBudgetStatusColor(b.percent_used),
                  }}
                />
              </div>

              {/* Issue 5: only the currency amounts and a bare progress
                  bar were shown before - the actual percentage (the
                  number the bar's fill width represents) wasn't spelled
                  out anywhere, which is the whole point of a progress
                  indicator. */}
              <div
                className="small text-end mt-1"
                style={{ color: getBudgetStatusColor(b.percent_used) }}
              >
                {Math.round(b.percent_used)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
