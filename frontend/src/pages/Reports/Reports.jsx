import { useEffect, useState } from "react";
import { LuChartColumn } from "react-icons/lu";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { getReportSummary } from "../../services/reportService";
import { getReportDateRangeForPeriod } from "../../utils/dateRanges";
import { exportReportCsv, exportReportExcel, exportReportPdf } from "../../utils/exportReport";

import DateRangeFilter from "../../components/reports/DateRangeFilter";
import ExportMenu from "../../components/reports/ExportMenu";
import SummaryCards from "../../components/reports/SummaryCards";
import TrendChart from "../../components/reports/TrendChart";
import ExpensePieChart from "../../components/dashboard/ExpensePieChart";
import BudgetPerformance from "../../components/reports/BudgetPerformance";
import FinancialInsights from "../../components/reports/FinancialInsights";

const DEFAULT_PERIOD = "this_month";

function periodLabelFor(period, from, to) {
  const labels = { today: "Today", last7: "This Week", this_month: "This Month", this_year: "This Year" };
  if (labels[period]) return labels[period];
  return `${new Date(from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(
    to
  ).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

function parseISODateLocal(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function dayKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function fillTrendGaps(trend, dateFrom, dateTo, granularity) {
  if (!dateFrom || !dateTo) return trend || [];

  const from = parseISODateLocal(dateFrom);
  const to = parseISODateLocal(dateTo);
  const periods = [];

  if (granularity === "month") {
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    const end = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cursor <= end) {
      periods.push(monthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const cursor = new Date(from);
    while (cursor <= to) {
      periods.push(dayKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const byPeriod = new Map((trend || []).map((point) => [point.period, point]));
  return periods.map((period) => byPeriod.get(period) || { period, income: 0, expenses: 0 });
}

export default function Reports() {
  const { showToast } = useToast();

  const initialRange = getReportDateRangeForPeriod(DEFAULT_PERIOD);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [customFrom, setCustomFrom] = useState(initialRange.date_from);
  const [customTo, setCustomTo] = useState(initialRange.date_to);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customFrom || !customTo) return;

    let ignore = false;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const data = await getReportSummary({ date_from: customFrom, date_to: customTo });
        if (!ignore) setReport(data);
      } catch {
        if (!ignore) showToast("Couldn't load report data. Please try again.", "error");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchReport();
    return () => {
      ignore = true;
    };

  }, [customFrom, customTo]);

  const label = periodLabelFor(period, customFrom, customTo);
  const hasAnyActivity =
    report && (Number(report.summary.total_income) > 0 || Number(report.summary.total_expenses) > 0);
  const filledTrend = report
    ? fillTrendGaps(report.trend, report.date_from, report.date_to, report.trend_granularity)
    : [];

  const handleExportCsv = () => {
    if (!report) return;
    exportReportCsv(report, label);
    showToast("Report exported as CSV.", "success");
  };

  const handleExportExcel = () => {
    if (!report) return;
    exportReportExcel(report, label);
    showToast("Report exported as Excel.", "success");
  };

  const handleExportPdf = () => {
    if (!report) return;
    exportReportPdf(report, label);
    showToast("Report exported as PDF.", "success");
  };

  return (
    <div>
      <div className="bg-surface rounded shadow-token-sm p-4 mb-3 d-flex justify-content-between align-items-start flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <span className="page-header-icon icon-report">
            <LuChartColumn size={22} />
          </span>
          <div>
            <h1 className="font-display fs-3 fw-semibold mb-1">Reports &amp; Financial Insights</h1>
            <span className="badge rounded-pill bg-surface-sunken text-ink">{label}</span>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <ExportMenu
            onExportCsv={handleExportCsv}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={!report || loading || !hasAnyActivity}
            disabledTitle={!loading && report && !hasAnyActivity ? "No data to export for this period" : undefined}
          />
        </div>
      </div>

      <div className="bg-surface rounded shadow-token-sm p-3 mb-3">
        <DateRangeFilter
          period={period}
          onPeriodChange={setPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomChange={(from, to) => {
            setCustomFrom(from);
            setCustomTo(to);
          }}
        />
      </div>

      <SummaryCards summary={report?.summary} loading={loading} />

      {!loading && report && !hasAnyActivity ? (
        <EmptyState
          icon={LuChartColumn}
          message={`No income or expenses recorded for ${label}. Try a different date range.`}
        />
      ) : (
        <>
          <div className="bg-surface rounded shadow-token-sm hover-card p-3 mb-3">
            <h2 className="font-display fs-6 fw-semibold mb-1">Income vs Expense Trend</h2>
            <p className="text-muted-ink small mb-2">
              {report?.trend_granularity === "month" ? "Monthly totals" : "Daily totals"} for this period
            </p>
            <TrendChart trend={filledTrend} granularity={report?.trend_granularity} />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
                <h2 className="font-display fs-6 fw-semibold mb-2">Expense Category Breakdown</h2>
                {loading ? (
                  <div className="text-center text-muted py-5">Loading…</div>
                ) : (
                  <ExpensePieChart
                    data={report?.expense_by_category || []}
                    labelKey="category"
                    valueKey="total"
                    emptyMessage="No expenses recorded in this date range."
                  />
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
                <h2 className="font-display fs-6 fw-semibold mb-2">Income Source Analysis</h2>
                {loading ? (
                  <div className="text-center text-muted py-5">Loading…</div>
                ) : (
                  <ExpensePieChart
                    data={report?.income_by_source || []}
                    labelKey="source"
                    valueKey="total"
                    emptyMessage="No income recorded in this date range."
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface rounded shadow-token-sm hover-card p-3 mb-3">
            <h2 className="font-display fs-6 fw-semibold mb-1">Budget Performance</h2>
            <p className="text-muted-ink small mb-3">How each budgeted category performed in this period</p>
            <BudgetPerformance budgetPerformance={report?.budget_performance} loading={loading} />
          </div>

          <div className="bg-surface rounded shadow-token-sm hover-card p-3 mb-3">
            <h2 className="font-display fs-6 fw-semibold mb-1">Financial Insights</h2>
            <p className="text-muted-ink small mb-3">Based on activity in this date range</p>
            <FinancialInsights insights={report?.insights} loading={loading} />
          </div>
        </>
      )}
    </div>
  );
}
