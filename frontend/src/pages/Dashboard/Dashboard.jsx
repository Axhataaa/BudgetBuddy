import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuPlus,
  LuTrendingUp,
  LuTrendingDown,
  LuWallet,
  LuTarget,
  LuCircleArrowDown,
  LuCircleArrowUp,
  LuInbox,
  LuPiggyBank,
  LuAward,
  LuFolderOpen,
} from "react-icons/lu";
import EmptyState from "../../components/ui/EmptyState";
import PeriodSelector, { MONTH_NAMES } from "../../components/ui/PeriodSelector";
import { useToast } from "../../components/ui/Toast";
import {
  getDashboardSummary,
  getRecentActivity,
} from "../../services/dashboardService";
// Recent transactions reuse the existing Expense/Income list endpoints
// directly - per the approved API Design Doc §26/§30 decision, this
// data is NOT duplicated inside the dashboard summary endpoint.
import { formatCurrency } from "../../utils/formatCurrency";
import { getMonthDateRange } from "../../utils/dateRanges";
import { getBudgetStatusColor } from "../../utils/budgetStatus";
import ExpensePieChart from "../../components/dashboard/ExpensePieChart";
import { formatRelativeDate } from "../../utils/formatRelativeDate";
import { useNavigate } from "react-router-dom";

const today = new Date();

function StatCard({
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
          className={`bg-surface rounded shadow-token-sm hover-card p-3 h-100 ${
              clickable ? "cursor-pointer" : ""
          }`}
          onClick={onClick}
          role={clickable ? "button" : undefined}
          tabIndex={clickable ? 0 : undefined}
          onKeyDown={(e) => {
              if (
                  clickable &&
                  (e.key === "Enter" || e.key === " ")
              ) {
                  onClick?.();
              }
          }}
      >
        <div className="d-flex align-items-center gap-2 text-muted-ink small mb-2">
          <Icon size={16} />
          {label}
        </div>
        <div className={`fs-5 fw-medium ${colorClass}`}>
          {amount === null ? (
            <span className="text-muted-ink fs-6">—</span>
          ) : isCurrency ? (
            <span className="font-currency">
              {formatCurrency(amount)}
            </span>
          ) : (
            amount
          )}
        </div>
        {subtitle && <div className="text-muted-ink small mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="col-6 col-md-3">
      <div className="bg-surface rounded shadow-token-sm hover-card  p-3">
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

function TransactionSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="d-flex align-items-center gap-3 py-2">
          <span className="placeholder-glow"><span className="placeholder rounded-circle" style={{ width: 32, height: 32, display: "inline-block" }} /></span>
          <span className="placeholder-glow flex-grow-1"><span className="placeholder col-6" /></span>
          <span className="placeholder-glow"><span className="placeholder col-3" /></span>
        </div>
      ))}
    </>
  );
}

export default function Dashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();

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

        const [summaryData, recentActivity] = await Promise.all([
          getDashboardSummary({ month, year }),
          getRecentActivity({ month, year }),
        ]);

        setSummary(summaryData);

        // Merge the two already-fetched short lists and sort by date -
        // this is presentational reordering, not aggregation, so it
        // belongs here rather than in a backend endpoint.
        setRecent(recentActivity);
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
  const hasBudgetData = summary?.budget_utilization?.length > 0;
  const categoryMax = hasCategoryData
    ? Math.max(...summary.expense_by_category.map((c) => Number(c.total)))
    : 0;
  const isEmptyPeriod =
    !loading && summary && Number(summary.total_income) === 0 && Number(summary.total_expenses) === 0;

  // Budget Remaining, and the overall utilization percentage - both
  // derived entirely from the summary's existing budget_utilization
  // array, no new backend endpoint needed.
  const totalBudgetLimit = hasBudgetData
    ? summary.budget_utilization.reduce((sum, b) => sum + Number(b.limit), 0)
    : 0;
  const totalBudgetSpent = hasBudgetData
    ? summary.budget_utilization.reduce((sum, b) => sum + Number(b.spent), 0)
    : 0;
  const budgetRemaining = totalBudgetLimit - totalBudgetSpent;
  const overallBudgetPercent = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

  // Highest spending category - expense_by_category is already sorted
  // descending by the backend (analytics/views.py), so this is just
  // the first entry, not a re-sort.
  const highestCategory = hasCategoryData ? summary.expense_by_category[0] : null;

  const getActivityMeta = (type) => {
    switch (type) {
      case "income":
        return {
          icon: LuCircleArrowUp,
          color: "text-income",
        };

      case "expense":
        return {
          icon: LuCircleArrowDown,
          color: "text-expense",
        };

      case "deposit":
        return {
          icon: LuPiggyBank,
          color: "text-success",
        };

      case "withdrawal":
        return {
          icon: LuWallet,
          color: "text-warning",
        };

      case "goal":
        return {
          icon: LuTarget,
          color: "text-primary",
        };

      case "achievement":
        return {
          icon: LuAward,
          color: "text-warning",
        };

      default:
        return {
          icon: LuWallet,
          color: "text-muted",
        };
    }
  };

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
          icon={LuInbox}
          message={`No transactions for ${periodLabel}. Add an expense or income to see this period come to life.`}
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
                  clickable
                  onClick={() => navigate("/income")}
                />
                <StatCard
                  label="Total Expenses"
                  amount={summary.total_expenses}
                  subtitle={periodLabel}
                  colorClass="text-expense"
                  icon={LuTrendingDown}
                  clickable
                  onClick={() => navigate("/expenses")}
                />
                <StatCard
                  label="Net Savings"
                  amount={summary.net_savings}
                  subtitle={Number(summary.net_savings) >= 0 ? "You're in the green" : "Spending exceeds income"}
                  colorClass={Number(summary.net_savings) >= 0 ? "text-income" : "text-expense"}
                  icon={LuWallet}
                />
                <StatCard
                  label="Budget Remaining"
                  amount={hasBudgetData ? budgetRemaining : null}
                  subtitle={
                    hasBudgetData
                      ? `${overallBudgetPercent.toFixed(0)}% of budget used`
                      : "No budgets set"
                  }
                  colorClass={hasBudgetData && budgetRemaining < 0 ? "text-expense" : "text-ink"}
                  icon={LuTarget}
                  clickable
                  onClick={() => navigate("/budgets")}
                />
              </>
            )}
          </div>

          {/* ================= Savings & Goals ================= */}

          {!loading && summary && (
            <>

              <h2 className="font-display fs-5 fw-semibold mt-4 mb-3">
                Savings & Goals
              </h2>

              <div className="row g-3 mb-4">

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
          )}

          {/* ================= Budget Progress ================= */}

          {!loading && hasBudgetData && (
            <div className="row g-3 mb-4">
              <div className="col-12">
                <div className="bg-surface rounded shadow-token-sm hover-card  p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-1">
                    <h2 className="font-display fs-6 fw-semibold mb-0">Budget Progress</h2>
                    <span className="small text-muted-ink">
                      {overallBudgetPercent.toFixed(0)}% of total budget used
                    </span>
                  </div>
                  <div className="row g-3">
                    {summary.budget_utilization.map((b) => (
                      <div key={b.category} className="col-6 col-md-4">
                        <div className="d-flex justify-content-between small mb-1">
                          <span>{b.category}</span>
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-5">
              <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-1">
                  <h2 className="font-display fs-6 fw-semibold mb-0">Spending by Category</h2>
                  {highestCategory && (
                    <span className="badge bg-surface-sunken text-ink">
                      Top: {highestCategory.category}
                    </span>
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
                          <span
                            className="placeholder col-12"
                            style={{ height: 6 }}
                          />
                        </span>
                      </div>
                    ))}
                  </>
                ) : !hasCategoryData ? (
                  <p className="text-muted-ink small mb-0">
                    No expenses recorded for {periodLabel}.
                  </p>
                ) : (
                  <ExpensePieChart
                    data={summary.expense_by_category}
                  />
                )}
              </div>
            </div>

            <div className="col-md-7">
              <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="font-display fs-6 fw-semibold mb-0">Recent Activity</h2>
                  <Link
                      to="/expenses"
                      className="small text-primary view-all-link"
                  >
                      View all →
                  </Link>
                </div>

                {loading ? (
                  <TransactionSkeleton />
                ) : recent.length === 0 ? (
                  <p className="text-muted-ink small mb-0 py-2">No recent activity for {periodLabel}.</p>
                ) : (
                  <div className="d-flex flex-column gap-1">
                    {recent.map((item) => {
                      const { icon: Icon, color } = getActivityMeta(item.type);

                      return (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="transaction-item d-flex align-items-center gap-3 py-2 px-2"
                        >
                          <Icon
                            size={20}
                            className={`${color} flex-shrink-0`}
                          />

                          <div className="flex-grow-1 min-w-0">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-medium text-truncate">
                                {item.title}
                              </span>

                              <span className="badge bg-surface-sunken text-ink">
                                {item.action}
                              </span>
                            </div>

                            <div className="text-muted-ink small">
                              {item.description && (
                                <>
                                  <span>{item.description}</span>
                                  <span>{" • "}</span>
                                </>
                              )}

                              <span className="fw-medium text-dark">
                                {formatRelativeDate(item.created_at)}
                              </span>

                              <span className="text-muted">
                                {" • "}
                                {new Date(item.created_at).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          </div>

                          <div className={`fw-semibold font-currency ${color}`}>
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
