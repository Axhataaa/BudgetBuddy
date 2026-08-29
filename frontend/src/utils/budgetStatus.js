// Kept in sync with backend/budgets/notifications.py's WARNING_THRESHOLD /
// HIGH_WARNING_THRESHOLD / EXCEEDED_THRESHOLD, and with BudgetViewSet.summary's
// alert_level cutoffs, so the visual state, in-app notifications, and email
// alerts all agree on the same 80/90/100 model.
export const BUDGET_WARNING_THRESHOLD = 80;
export const BUDGET_HIGH_WARNING_THRESHOLD = 90;
export const BUDGET_EXCEEDED_THRESHOLD = 100;

export function getBudgetStatusColor(percentUsed) {
  if (percentUsed >= BUDGET_HIGH_WARNING_THRESHOLD) return "var(--color-danger)";
  if (percentUsed >= BUDGET_WARNING_THRESHOLD) return "var(--color-warning)";
  return "var(--color-income)";
}

export function getBudgetChartMax(maxPercentUsed) {
  if (!Number.isFinite(maxPercentUsed) || maxPercentUsed <= 100) return 100;
  if (maxPercentUsed <= 125) return 125;
  if (maxPercentUsed <= 150) return 150;
  if (maxPercentUsed <= 175) return 175;
  if (maxPercentUsed <= 200) return 200;
  return Math.ceil(maxPercentUsed / 50) * 50;
}

const NICE_TICK_STEPS = [10, 20, 25, 50, 100, 200, 250, 500];

export function getBudgetChartTicks(chartMax) {
  if (!Number.isFinite(chartMax) || chartMax <= 0) return [0, 100];

  const idealStep = chartMax / 4;
  const step =
    NICE_TICK_STEPS.find((s) => s >= idealStep) ||
    Math.ceil(idealStep / 100) * 100;

  const ticks = new Set();
  for (let t = 0; t < chartMax; t += step) {
    ticks.add(t);
  }
  ticks.add(chartMax);

  if (chartMax > 100) ticks.add(100);
  return [...ticks].sort((a, b) => a - b);
}
