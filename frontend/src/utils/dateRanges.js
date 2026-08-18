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

export function getMonthDateRange(month, year) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  return { date_from: toISODate(from), date_to: toISODate(to) };
}

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

export function getLastNMonthsRange(n) {
  const today = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  }
  return {
    date_from: `${months[0]}-01`,
    date_to: toISODate(today),
    months,
  };
}
