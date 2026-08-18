import api from "../api/axios";

export const listAchievements = async () => {
  const response = await api.get(
    "budgets/savings-goals/achievements/"
  );

  return response.data;
};

export const deleteAchievement = async (id) => {
  await api.delete(`budgets/savings-goals/${id}/`);
};