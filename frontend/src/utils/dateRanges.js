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
