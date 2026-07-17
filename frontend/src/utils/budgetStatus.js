/**
 * Green under 70%, yellow 70-90%, red above 90% - one shared threshold
 * definition used everywhere a budget utilization percentage is shown
 * (Dashboard's Budget Progress widget, the Budgets page's cards), so
 * the two can never silently drift apart into different color rules.
 */
export function getBudgetStatusColor(percentUsed) {
  if (percentUsed > 90) return "var(--color-danger)";
  if (percentUsed >= 70) return "var(--color-warning)";
  return "var(--color-income)";
}
