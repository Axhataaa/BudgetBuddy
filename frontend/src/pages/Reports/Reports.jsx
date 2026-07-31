import { useEffect, useState } from "react";
import { LuFileDown, LuFileSpreadsheet, LuFileText, LuChartColumn } from "react-icons/lu";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { getReportSummary } from "../../services/reportService";
import { getDateRangeForPeriod } from "../../utils/dateRanges";
import { exportReportCsv, exportReportExcel, exportReportPdf } from "../../utils/exportReport";

import DateRangeFilter from "../../components/reports/DateRangeFilter";
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

export default function Reports() {
  const { showToast } = useToast();

  const initialRange = getDateRangeForPeriod(DEFAULT_PERIOD);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [customFrom, setCustomFrom] = useState(initialRange.date_from);
  const [customTo, setCustomTo] = useState(initialRange.date_to);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customFrom || !customTo) return;
    // Bug 4: without this guard, an in-flight request from a previous
    // date_from/date_to (or a duplicate fire, e.g. React 18 StrictMode
    // in dev) can resolve AFTER a newer one and overwrite fresh trend
    // data with stale data - the graph would then "not reflect" a
    // just-added transaction even though the latest request's data
    // was correct. `ignore` makes sure only the most recent request
    // for the currently-selected range is ever applied to state.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customFrom, customTo]);

  const label = periodLabelFor(period, customFrom, customTo);
  const hasAnyActivity =
    report && (Number(report.summary.total_income) > 0 || Number(report.summary.total_expenses) > 0);

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
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
        <div>
          <h1 className="font-display fs-3 fw-semibold mb-0">Reports</h1>
          <p className="text-muted-ink small mb-0">{label}</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="secondary" icon={LuFileText} onClick={handleExportCsv} disabled={!report || loading}>
            Export CSV
          </Button>
          <Button variant="secondary" icon={LuFileSpreadsheet} onClick={handleExportExcel} disabled={!report || loading}>
            Export Excel
          </Button>
          <Button variant="primary" icon={LuFileDown} onClick={handleExportPdf} disabled={!report || loading}>
            Export PDF
          </Button>
        </div>
      </div>

      <div className="mb-3">
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
            <TrendChart trend={report?.trend} granularity={report?.trend_granularity} />
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

          <div className="bg-surface rounded shadow-token-sm hover-card p-3">
            <h2 className="font-display fs-6 fw-semibold mb-1">Financial Insights</h2>
            <p className="text-muted-ink small mb-3">Based on activity in this date range</p>
            <FinancialInsights insights={report?.insights} loading={loading} />
          </div>
        </>
      )}
    </div>
  );
}
