// The single source of truth for the Purchase vs Non-Purchase distinction
// used across Savings Goals / Achievements UI. Always branch on goal_type,
// never on is_completed/is_archived — those are true for both categories.
export function isPurchaseGoal(goal) {
  const type = goal?.goal_type;

  // Goals created before goal_type existed receive PURCHASE via the
  // migration default; a missing/null value here falls back the same way.
  if (!type) {
    return true;
  }

  return type === "PURCHASE";
}
