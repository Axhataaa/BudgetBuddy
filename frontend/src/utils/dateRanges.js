const pad = (n) => String(n).padStart(2, "0");
const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const TIME_PERIOD_OPTIONS = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom Date Range" },
];

/**
 * Translates a Time Period preset into {date_from, date_to} for the
 * existing ?date_from=&date_to= backend filter (ExpenseFilter's
 * DateRangeFilterMixin) - no new backend endpoint or param needed,
 * this just computes the two dates a preset implies.
 *
 * Returns null for "" (All Time - no date filter applied) and "custom"
 * (the caller supplies its own from/to via separate date inputs).
 */
export function getDateRangeForPeriod(period) {
  const today = new Date();

  switch (period) {
    case "today":
      return { date_from: toISODate(today), date_to: toISODate(today) };
    case "last7": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { date_from: toISODate(from), date_to: toISODate(today) };
    }
    case "last30": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { date_from: toISODate(from), date_to: toISODate(today) };
    }
    case "this_month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { date_from: toISODate(from), date_to: toISODate(today) };
    }
    case "this_year": {
      const from = new Date(today.getFullYear(), 0, 1);
      return { date_from: toISODate(from), date_to: toISODate(today) };
    }
    default:
      return null;
  }
}

/** First/last calendar day of a given month - used to scope Dashboard's
 * recent-transactions fetch to whichever period is currently selected. */
export function getMonthDateRange(month, year) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  return { date_from: toISODate(from), date_to: toISODate(to) };
}

/**
 * Reports-page-specific version of getDateRangeForPeriod(), used only
 * by components/reports/DateRangeFilter.jsx (Reports.jsx's date
 * filter). getDateRangeForPeriod() above is shared with Expenses.jsx/
 * Income.jsx and deliberately left untouched by this fix - this is a
 * separate function, not a change to that one, specifically to avoid
 * touching those two unrelated pages at all.
 *
 * The bug this fixes: getDateRangeForPeriod()'s "this_month"/
 * "this_year" cases resolve date_to to TODAY, which is the right
 * behavior for a transaction list ("show me this month's spending so
 * far") but wrong for a Reports period, which the spec defines as the
 * FULL calendar month/year regardless of today's date (e.g. selecting
 * "Month" in early August should report on the whole of August, 01-31,
 * not just 01-06). "today" and "last7" (Week - a rolling 7-day window,
 * matching the same convention Expenses/Income already use for their
 * own "Week" preset) are correct as-is and delegate straight through.
 */
export function getReportDateRangeForPeriod(period) {
  const today = new Date();

  switch (period) {
    case "this_month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { date_from: toISODate(from), date_to: toISODate(to) };
    }
    case "this_year": {
      const from = new Date(today.getFullYear(), 0, 1);
      const to = new Date(today.getFullYear(), 11, 31);
      return { date_from: toISODate(from), date_to: toISODate(to) };
    }
    default:
      return getDateRangeForPeriod(period);
  }
}
