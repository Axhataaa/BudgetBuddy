import { getReportDateRangeForPeriod } from "../../utils/dateRanges";

// Same presets Expenses/Income already use, minus "All Time" - Reports
// always needs a concrete date_from/date_to (the backend's
// ReportQuerySerializer requires both), so "All Time" isn't a valid
// option here the way it is on the transaction list pages.
const REPORT_PERIODS = [
  { value: "today", label: "Today" },
  { value: "last7", label: "Week" },
  { value: "this_month", label: "Month" },
  { value: "this_year", label: "Year" },
  { value: "custom", label: "Custom Range" },
];

export default function DateRangeFilter({ period, onPeriodChange, customFrom, customTo, onCustomChange }) {
  const handlePreset = (value) => {
    onPeriodChange(value);
    if (value !== "custom") {
      const range = getReportDateRangeForPeriod(value);
      onCustomChange(range.date_from, range.date_to);
    }
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-2">
      <div className="d-flex flex-wrap gap-2" role="group" aria-label="Report period">
        {REPORT_PERIODS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`chip-toggle ${period === opt.value ? "active" : ""}`}
            onClick={() => handlePreset(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="d-flex align-items-center gap-2">
          <input
            type="date"
            className="form-control form-control-sm"
            value={customFrom}
            max={customTo}
            onChange={(e) => onCustomChange(e.target.value, customTo)}
            aria-label="From date"
          />
          <span className="text-muted-ink small">to</span>
          <input
            type="date"
            className="form-control form-control-sm"
            value={customTo}
            min={customFrom}
            onChange={(e) => onCustomChange(customFrom, e.target.value)}
            aria-label="To date"
          />
        </div>
      )}
    </div>
  );
}
