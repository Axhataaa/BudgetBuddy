import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuPlus, LuInbox } from "react-icons/lu";

import EmptyState from "../../components/ui/EmptyState";
import PeriodSelector, { MONTH_NAMES } from "../../components/ui/PeriodSelector";
import { useToast } from "../../components/ui/Toast";

import { getDashboardSummary, getRecentActivity } from "../../services/dashboardService";
import { listSavingsGoals } from "../../services/savingsGoalService";

import HeroSection from "../../components/dashboard/HeroSection";
import StatCards from "../../components/dashboard/StatCards";
import SpendingTrends from "../../components/dashboard/SpendingTrends";
import BudgetProgress from "../../components/dashboard/BudgetProgress";
import SavingsGoals from "../../components/dashboard/SavingsGoals";
import LatestAchievement from "../../components/dashboard/LatestAchievement";
import SmartInsights from "../../components/dashboard/SmartInsights";
import RecentActivity from "../../components/dashboard/RecentActivity";

const today = new Date();

export default function Dashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

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
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
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

      <HeroSection summary={summary} periodLabel={periodLabel} loading={loading} />

      <StatCards
        summary={summary}
        loading={loading}
        hasBudgetData={hasBudgetData}
        budgetRemaining={budgetRemaining}
        overallBudgetPercent={overallBudgetPercent}
        navigate={navigate}
      />

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

      {/*
        Part 2 fix: this used to be `isEmptyPeriod ? <EmptyState/> :
        (...entire rest of the dashboard...)`, which hid the whole
        page - including the balance and every card above - the
        moment a selected month had no transactions. Everything above
        this point either uses lifetime data (HeroSection) or is
        meaningful independent of the selected month (budgets, goals,
        achievements), so it stays visible unconditionally now. Only
        the charts/recent-activity row genuinely has nothing to show
        for an empty month, so only that row gets the empty state.
      */}
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