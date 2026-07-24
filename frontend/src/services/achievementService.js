import api from "../api/axios";

export const listAchievements = async () => {
  const response = await api.get(
    "budgets/savings-goals/achievements/"
  );

  return response.data;
};

/**
 * Achievements are archived SavingsGoal rows (is_archived=True,
 * is_purchased=True) - there's no separate Achievement model, so
 * "deleting an achievement" is deleting that SavingsGoal row via the
 * same endpoint deleteSavingsGoal() already uses. Its own
 * SavingsTransaction history cascades with it (they have no meaning
 * without the goal); Income/Expense records are untouched.
 */
export const deleteAchievement = async (id) => {
  await api.delete(`budgets/savings-goals/${id}/`);
};