/**
 * Derives a single 0-100 "financial health" score from fields the
 * dashboard summary endpoint already returns - no new API calls, no
 * invented numbers. Used by <FinancialHealth /> on the dashboard hero.
 *
 * Weighting:
 *   50% savings rate      - summary.savings_rate, clamped to 0-100
 *   35% budget discipline - penalised per over/near-limit category
 *                           (neutral 65 when no budgets exist yet)
 *   15% goal engagement   - rewards having an active savings goal
 */
export function getFinancialHealth(summary) {
  if (!summary) return { score: 0, label: "—" };

  const savingsRate = Number(summary.savings_rate) || 0;
  const savingsScore = Math.min(Math.max(savingsRate, 0), 100);

  const hasBudgets = Number(summary.total_budget) > 0;
  const overspent = summary.budget_status?.overspent_categories || 0;
  const warning = summary.budget_status?.warning_categories || 0;
  const budgetScore = hasBudgets
    ? Math.max(100 - overspent * 30 - warning * 15, 0)
    : 65;

  const activeGoals = Number(summary.active_goals) || 0;
  const completedGoals = Number(summary.completed_goals) || 0;
  const goalsScore = activeGoals > 0 ? 100 : completedGoals > 0 ? 70 : 50;

  const score = Math.round(
    savingsScore * 0.5 + budgetScore * 0.35 + goalsScore * 0.15
  );

  let label = "Needs attention";
  if (score >= 75) label = "Excellent";
  else if (score >= 55) label = "Good";
  else if (score >= 35) label = "Fair";

  return { score, label };
}
