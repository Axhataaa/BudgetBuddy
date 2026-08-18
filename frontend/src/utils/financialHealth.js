export function getFinancialHealth(summary) {
  if (!summary) return { score: 0, label: "—" };

  const savingsRate = Number(summary.lifetime?.savings_rate) || 0;
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
