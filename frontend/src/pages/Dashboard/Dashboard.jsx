import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuPlus, LuTrendingUp, LuTrendingDown, LuWallet, LuLayoutDashboard } from "react-icons/lu";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonRows from "../../components/ui/SkeletonRows";
import PeriodSelector, { MONTH_NAMES } from "../../components/ui/PeriodSelector";
import { useToast } from "../../components/ui/Toast";
import { getDashboardSummary } from "../../services/dashboardService";
// Recent transactions reuse the existing Expense/Income list endpoints
// directly - per the approved API Design Doc §26/§30 decision, this
// data is NOT duplicated inside the dashboard summary endpoint.
import { listExpenses } from "../../services/expenseService";
import { listIncomes } from "../../services/incomeService";
import { formatCurrency } from "../../utils/formatCurrency";
import { getMonthDateRange } from "../../utils/dateRanges";

const today = new Date();

function StatCard({ label, amount, subtitle, colorClass, icon: Icon }) {
  return (
    <div className="col-md-4">
      <div className="bg-surface rounded shadow-token-sm p-3 h-100">
        <div className="d-flex align-items-center gap-2 text-muted-ink small mb-2">
          <Icon size={16} />
          {label}
        </div>
        <div className={`font-currency fs-4 fw-medium ${colorClass}`}>
          {formatCurrency(amount)}
        </div>
        {subtitle && <div className="text-muted-ink small mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="col-md-4">
      <div className="bg-surface rounded shadow-token-sm p-3">
        <span className="placeholder-glow d-block mb-2">
          <span className="placeholder col-6" />
        </span>
        <span className="placeholder-glow d-block">
          <span className="placeholder col-8" style={{ height: 28 }} />
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { showToast } = useToast();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // Recent transactions are scoped to the SAME selected period as
        // the summary cards - otherwise switching to a past month would
        // show that month's totals next to today's most recent activity,
        // which reads as broken rather than "viewing history."
        const { date_from, date_to } = getMonthDateRange(month, year);

        const [summaryData, expensesData, incomesData] = await Promise.all([
          getDashboardSummary({ month, year }),
          listExpenses({ page_size: 5, ordering: "-date", date_from, date_to }),
          listIncomes({ page_size: 5, ordering: "-date", date_from, date_to }),
        ]);

        setSummary(summaryData);

        // Merge the two already-fetched short lists and sort by date -
        // this is presentational reordering, not aggregation, so it
        // belongs here rather than in a backend endpoint (§ architecture
        // note: aggregation is backend's job, merging two small lists
        // for display isn't the same kind of work).
        const merged = [
          ...expensesData.results.map((e) => ({ ...e, type: "expense", label: e.title })),
          ...incomesData.results.map((i) => ({ ...i, type: "income", label: i.source })),
        ]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        setRecent(merged);
      } catch {
        showToast("Couldn't load dashboard data. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const hasCategoryData = summary?.expense_by_category?.length > 0;
  const categoryMax = hasCategoryData
    ? Math.max(...summary.expense_by_category.map((c) => Number(c.total)))
    : 0;
  const isEmptyPeriod =
    !loading && summary && Number(summary.total_income) === 0 && Number(summary.total_expenses) === 0;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="font-display fs-3 fw-semibold mb-0">Dashboard</h1>
          <p className="text-muted-ink small mb-0">{periodLabel}</p>
        </div>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <PeriodSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
          <div className="d-flex gap-2">
            <Link to="/expenses" className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
              <LuPlus size={16} />
              Expense
            </Link>
            <Link to="/income" className="btn btn-primary d-inline-flex align-items-center gap-2">
              <LuPlus size={16} />
              Income
            </Link>
          </div>
        </div>
      </div>

      {isEmptyPeriod ? (
        <EmptyState
          icon={LuLayoutDashboard}
          message={`No activity recorded for ${periodLabel} yet — add an expense or income to see this period come to life.`}
          action={
            <div className="d-flex gap-2">
              <Link to="/expenses" className="btn btn-outline-primary">Add Expense</Link>
              <Link to="/income" className="btn btn-primary">Add Income</Link>
            </div>
          }
        />
      ) : (
        <>
          <div className="row g-3 mb-4">
            {loading || !summary ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  label="Total Income"
                  amount={summary.total_income}
                  subtitle={periodLabel}
                  colorClass="text-income"
                  icon={LuTrendingUp}
                />
                <StatCard
                  label="Total Expenses"
                  amount={summary.total_expenses}
                  subtitle={periodLabel}
                  colorClass="text-expense"
                  icon={LuTrendingDown}
                />
                <StatCard
                  label="Net Savings"
                  amount={summary.net_savings}
                  subtitle={Number(summary.net_savings) >= 0 ? "You're in the green" : "Spending exceeds income"}
                  colorClass={Number(summary.net_savings) >= 0 ? "text-income" : "text-expense"}
                  icon={LuWallet}
                />
              </>
            )}
          </div>

          {!loading && summary?.budget_utilization?.length > 0 && (
            <div className="row g-3 mb-4">
              <div className="col-12">
                <div className="bg-surface rounded shadow-token-sm p-3">
                  <h2 className="font-display fs-6 fw-semibold mb-3">Budget Progress</h2>
                  <div className="row g-3">
                    {summary.budget_utilization.map((b) => {
                      const barColor =
                        b.percent_used >= 100
                          ? "var(--color-danger)"
                          : b.percent_used >= 70
                          ? "var(--color-warning)"
                          : "var(--color-income)";
                      return (
                        <div key={b.category} className="col-md-4">
                          <div className="d-flex justify-content-between small mb-1">
                            <span>{b.category}</span>
                            <span className="font-currency text-muted-ink">
                              {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                            </span>
                          </div>
                          <div className="progress" style={{ height: 6 }}>
                            <div
                              className="progress-bar"
                              style={{ width: `${Math.min(b.percent_used, 100)}%`, backgroundColor: barColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-5">
              <div className="bg-surface rounded shadow-token-sm p-3 h-100">
                <h2 className="font-display fs-6 fw-semibold mb-3">Spending by Category</h2>
                {loading ? (
                  <div className="text-muted-ink small">Loading...</div>
                ) : !hasCategoryData ? (
                  <p className="text-muted-ink small mb-0">No expenses recorded for {periodLabel}.</p>
                ) : (
                  summary.expense_by_category.map((c) => (
                    <div key={c.category} className="mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>{c.category}</span>
                        <span className="font-currency text-expense">{formatCurrency(c.total)}</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${(Number(c.total) / categoryMax) * 100}%`,
                            backgroundColor: "var(--color-expense)",
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="col-md-7">
              <div className="bg-surface rounded shadow-token-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="font-display fs-6 fw-semibold mb-0">Recent Transactions</h2>
                  <Link to="/expenses" className="small text-primary">View all</Link>
                </div>
                <table className="table table-sm mb-0 align-middle">
                  <tbody>
                    {loading ? (
                      <SkeletonRows rows={5} columns={3} />
                    ) : recent.length === 0 ? (
                      <tr>
                        <td className="text-muted-ink small py-3">No activity for {periodLabel}.</td>
                      </tr>
                    ) : (
                      recent.map((item) => (
                        <tr key={`${item.type}-${item.id}`}>
                          <td>
                            <span className={`badge ${item.type === "income" ? "bg-success" : "bg-danger"} bg-opacity-10 text-${item.type === "income" ? "income" : "expense"}`}>
                              {item.type === "income" ? "Income" : "Expense"}
                            </span>
                          </td>
                          <td>{item.label}</td>
                          <td className="text-muted-ink small">{item.date}</td>
                          <td className={`text-end font-currency ${item.type === "income" ? "text-income" : "text-expense"}`}>
                            {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
