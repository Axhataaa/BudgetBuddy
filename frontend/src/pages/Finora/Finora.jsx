import { useEffect, useState } from "react";
import { LuSparkles, LuMessageCircle, LuChartColumn } from "react-icons/lu";

import { useToast } from "../../components/ui/Toast";
import { getReportSummary } from "../../services/reportService";
import { getReportDateRangeForPeriod } from "../../utils/dateRanges";

import DateRangeFilter from "../../components/reports/DateRangeFilter";
import AIFinancialAnalysis from "../../components/finora/AIFinancialAnalysis";
import FinoraChat from "../../components/finora/FinoraChat";

const DEFAULT_PERIOD = "this_month";

function periodLabelFor(period, from, to) {
  const labels = { today: "Today", last7: "This Week", this_month: "This Month", this_year: "This Year" };
  if (labels[period]) return labels[period];
  return `${new Date(from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(
    to
  ).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}

export default function Finora() {
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
        if (!ignore) showToast("Couldn't load your financial data. Please try again.", "error");
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

  return (
    <div>
      <div className="bg-surface rounded shadow-token-sm p-4 mb-3 d-flex justify-content-between align-items-start flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <span className="page-header-icon icon-finora">
            <LuSparkles size={22} />
          </span>
          <div>
            <h1 className="font-display fs-3 fw-semibold mb-1">Finora</h1>
            <p className="text-muted-ink mb-0">Your AI-powered financial intelligence, in one place.</p>
          </div>
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

      {/* ================= Financial Overview ================= */}

      <section className="mb-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <LuChartColumn size={16} className="text-muted-ink" />
          <h2 className="font-display fs-6 fw-semibold mb-0">Financial Overview</h2>
        </div>

        <AIFinancialAnalysis
          dateFrom={customFrom}
          dateTo={customTo}
          periodLabel={label}
          canAnalyze={!loading && Boolean(hasAnyActivity)}
        />
      </section>

      {/* ================= Ask Finora ================= */}

      <section className="mb-3">
        <div className="d-flex align-items-center gap-2 mb-1">
          <LuMessageCircle size={16} className="text-muted-ink" />
          <h2 className="font-display fs-6 fw-semibold mb-0">Ask Finora</h2>
        </div>
        <p className="text-muted-ink small mb-2">Your AI financial assistant</p>

        <FinoraChat dateFrom={customFrom} dateTo={customTo} />
      </section>
    </div>
  );
}
