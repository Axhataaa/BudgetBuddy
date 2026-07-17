import api from "../api/axios";

export const listAchievements = async () => {
  const response = await api.get(
    "budgets/savings-goals/achievements/"
  );

  return response.data;
};