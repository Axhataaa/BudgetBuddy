import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuPlus, LuInbox, LuLayoutDashboard } from "react-icons/lu";

import EmptyState from "../../components/ui/EmptyState";
import PeriodSelector, { MONTH_NAMES } from "../../components/ui/PeriodSelector";
import { useToast } from "../../components/ui/Toast";

import { getDashboardSummary, getRecentActivity } from "../../services/dashboardService";
import { listSavingsGoals } from "../../services/savingsGoalService";
import { getReportSummary } from "../../services/reportService";
import { getLastNMonthsRange } from "../../utils/dateRanges";

import HeroSection from "../../components/dashboard/HeroSection";
import StatCards from "../../components/dashboard/StatCards";
import SpendingTrends from "../../components/dashboard/SpendingTrends";
import BudgetProgress from "../../components/dashboard/BudgetProgress";
import SavingsGoals from "../../components/dashboard/SavingsGoals";
import LatestAchievement from "../../components/dashboard/LatestAchievement";
import SmartInsights from "../../components/dashboard/SmartInsights";
import RecentActivity from "../../components/dashboard/RecentActivity";
import TrendChart from "../../components/reports/TrendChart";

const today = new Date();

function fillMissingMonths(trend, months) {
  const byPeriod = new Map((trend || []).map((point) => [point.period, point]));
  return months.map((period) => byPeriod.get(period) || { period, income: 0, expenses: 0 });
}

export default function Dashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [summaryData, recentActivity, goalsData] = await Promise.all([
          getDashboardSummary({ month, year }),
          getRecentActivity({ month, year }),
          listSavingsGoals({ ordering: "target_date" }),
        ]);

        setSummary(summaryData);
        setRecent(recentActivity);
        setGoals(goalsData.results || []);
      } catch {
        showToast("Couldn't load dashboard data. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [month, year]);


  useEffect(() => {
    const fetchTrend = async () => {
      setTrendLoading(true);
      try {
        const { date_from, date_to, months } = getLastNMonthsRange(6);
        const report = await getReportSummary({ date_from, date_to });
        setMonthlyTrend(fillMissingMonths(report.trend, months));
      } catch {
        setMonthlyTrend([]);
      } finally {
        setTrendLoading(false);
      }
    };

    fetchTrend();
  }, []);

  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const hasBudgetData = summary?.budget_utilization?.length > 0;
  const hasCategoryData = summary?.expense_by_category?.length > 0;

  const isEmptyPeriod =
    !loading && summary && Number(summary.total_income) === 0 && Number(summary.total_expenses) === 0;

  const totalBudgetLimit = hasBudgetData
    ? summary.budget_utilization.reduce((sum, b) => sum + Number(b.limit), 0)
    : 0;
  const totalBudgetSpent = hasBudgetData
    ? summary.budget_utilization.reduce((sum, b) => sum + Number(b.spent), 0)
    : 0;
  const budgetRemaining = totalBudgetLimit - totalBudgetSpent;
  const overallBudgetPercent = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

  const highestCategory = hasCategoryData ? summary.expense_by_category[0] : null;

  return (
    <div>
      <div className="bg-surface rounded shadow-token-sm p-4 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <span className="page-header-icon icon-dashboard">
            <LuLayoutDashboard size={22} />
          </span>
          <div>
            <h1 className="font-display fs-3 fw-semibold mb-1">Dashboard</h1>
            <p className="text-muted-ink mb-0">{periodLabel}</p>
          </div>
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

      <HeroSection summary={summary} periodLabel={periodLabel} loading={loading} />

      <StatCards
        summary={summary}
        loading={loading}
        hasBudgetData={hasBudgetData}
        budgetRemaining={budgetRemaining}
        overallBudgetPercent={overallBudgetPercent}
        navigate={navigate}
      />

      {}
      <div className="bg-surface rounded shadow-token-sm hover-card p-3 mb-3">
        <h2 className="font-display fs-6 fw-semibold mb-1">Income vs Expenses</h2>
        <p className="text-muted-ink small mb-3">Last 6 months</p>
        {trendLoading ? (
          <div className="placeholder-glow">
            <span className="placeholder col-12" style={{ height: 260, display: "block" }} />
          </div>
        ) : (
          <TrendChart trend={monthlyTrend} granularity="month" />
        )}
      </div>

      <BudgetProgress
        summary={summary}
        loading={loading}
        hasBudgetData={hasBudgetData}
        overallBudgetPercent={overallBudgetPercent}
      />

      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <SavingsGoals goals={goals} loading={loading} />
        </div>
        <div className="col-lg-6">
          <SmartInsights summary={summary} loading={loading} />
        </div>
      </div>

      <LatestAchievement summary={summary} />

      {}
      {isEmptyPeriod ? (
        <EmptyState
          icon={LuInbox}
          message={`This month has no transactions yet. Add an expense or income for ${periodLabel} to see it here.`}
          action={
            <div className="d-flex gap-2">
              <Link to="/expenses" className="btn btn-outline-primary">Add Expense</Link>
              <Link to="/income" className="btn btn-primary">Add Income</Link>
            </div>
          }
        />
      ) : (
        <div className="row g-3">
          <div className="col-md-5">
            <SpendingTrends
              summary={summary}
              loading={loading}
              periodLabel={periodLabel}
              highestCategory={highestCategory}
            />
          </div>
          <div className="col-md-7">
            <RecentActivity recent={recent} loading={loading} periodLabel={periodLabel} />
          </div>
        </div>
      )}
    </div>
  );
}