import { useMemo } from "react";
import { LuFolderOpen } from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";
import { getBudgetStatusColor, getBudgetChartMax, getBudgetChartTicks } from "../../utils/budgetStatus";
import { getExpenseCategoryMeta } from "../../pages/Expenses/expenseConstants";
import EmptyState from "../ui/EmptyState";

const LABEL_WIDTH = 165;
const PERCENT_WIDTH = 56;
const COLUMN_GAP = 10;
const ROW_TEMPLATE_COLUMNS = `${LABEL_WIDTH}px 1fr ${PERCENT_WIDTH}px`;

function ChartRow({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: ROW_TEMPLATE_COLUMNS,
        columnGap: COLUMN_GAP,
        alignItems: "center",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

export default function BudgetPerformance({ budgetPerformance, loading }) {

  const chartMax = useMemo(() => {
    const percentages = (budgetPerformance || []).map((b) => b.percent_used);
    const highest = percentages.length ? Math.max(...percentages) : 0;
    return getBudgetChartMax(highest);
  }, [budgetPerformance]);

  const showThreshold = chartMax > 100;
  const thresholdPosition = (100 / chartMax) * 100;

  const ticks = useMemo(() => getBudgetChartTicks(chartMax), [chartMax]);

  if (loading) {
    return (
      <div className="d-flex flex-column gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="d-flex align-items-center gap-3">
            <span className="placeholder-glow" style={{ width: 120 }}>
              <span className="placeholder col-10" />
            </span>
            <span className="placeholder-glow flex-grow-1">
              <span className="placeholder col-12" style={{ height: 10 }} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (!budgetPerformance?.length) {
    return <EmptyState icon={LuFolderOpen} message="No budgets for this period." />;
  }

  return (
    <div className="w-100">
      <div className="position-relative w-100">
        <div className="d-flex flex-column gap-3 w-100">
          {budgetPerformance.map((b) => {
            const meta = getExpenseCategoryMeta(b.category);
            const CategoryIcon = meta.icon;
            const barColor = getBudgetStatusColor(b.percent_used);
            const isOverBudget = b.percent_used > 100;

            return (
              <ChartRow key={b.category}>
                <div className="d-flex align-items-center gap-2 small" style={{ minWidth: 0 }}>
                  <span className={`category-icon ${meta.badge}`} style={{ width: 26, height: 26, flexShrink: 0 }}>
                    <CategoryIcon size={13} />
                  </span>
                  <span className="d-flex flex-column" style={{ minWidth: 0 }}>
                    <span className="fw-medium text-ink text-truncate">{b.category}</span>
                    <span className="font-currency text-muted-ink text-truncate" style={{ fontSize: "0.68rem" }}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                  </span>
                </div>

                <div className="progress progress-track" style={{ height: 20 }}>
                  <div
                    className="progress-bar"
                    style={{
    
                      width: `${Math.min((b.percent_used / chartMax) * 100, 100)}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>

                <div className="text-end">
                  <div className="fw-semibold small" style={{ color: barColor }}>
                    {b.percent_used.toFixed(0)}%
                  </div>
                  {isOverBudget && (
                    <div className="small" style={{ color: "var(--color-danger)", fontSize: "0.62rem" }}>
                      +{(b.percent_used - 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </ChartRow>
            );
          })}
        </div>

        <div
          className="position-absolute top-0 bottom-0"
          style={{
            left: LABEL_WIDTH + COLUMN_GAP,
            right: PERCENT_WIDTH + COLUMN_GAP,
            pointerEvents: "none",
          }}
        >
          {ticks
            .filter((t) => t !== 0 && t !== chartMax)
            .map((t) => (
              <div
                key={`grid-${t}`}
                className="position-absolute top-0 bottom-0"
                style={{
                  left: `${(t / chartMax) * 100}%`,
                  width: 1,
                  backgroundColor: "var(--color-border)",
                }}
              />
            ))}
          {showThreshold && (
            <div
              className="position-absolute top-0 bottom-0"
              style={{
                left: `${thresholdPosition}%`,
                width: 2,
                backgroundColor: "var(--color-ink-muted)",
              }}
              title="100% budget limit"
            />
          )}
        </div>
      </div>

      <ChartRow>
        <div />
        <div className="position-relative" style={{ height: showThreshold ? 30 : 18, marginTop: 8 }}>
          {ticks.map((t, i) => {
            const isFirst = i === 0;
            const isLast = i === ticks.length - 1;
            const isThreshold = t === 100;
            return (
              <span
                key={t}
                className="position-absolute"
                style={{
                  left: isLast ? undefined : `${(t / chartMax) * 100}%`,
                  right: isLast ? 0 : undefined,
                  transform: isFirst || isLast ? "none" : "translateX(-50%)",
                  fontSize: "0.68rem",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  color: isThreshold ? "var(--color-ink)" : "var(--color-ink-muted)",
                  fontWeight: isThreshold ? 600 : 400,
                }}
              >
                {t}%
                {isThreshold && (
                  <span
                    className="d-block text-center"
                    style={{ fontSize: "0.6rem", fontWeight: 400, color: "var(--color-ink-muted)" }}
                  >
                    Budget limit
                  </span>
                )}
              </span>
            );
          })}
        </div>
        <div />
      </ChartRow>
    </div>
  );
}
