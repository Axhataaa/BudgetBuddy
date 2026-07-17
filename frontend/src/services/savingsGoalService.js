import api from "../api/axios";

export const listSavingsGoals = async (params = {}) => {
  const response = await api.get("budgets/savings-goals/", {
    params,
  });

  return response.data;
};

export const createSavingsGoal = async (payload) => {
  const response = await api.post(
    "budgets/savings-goals/",
    payload
  );

  return response.data;
};

export const updateSavingsGoal = async (id, payload) => {
  const response = await api.patch(
    `budgets/savings-goals/${id}/`,
    payload
  );

  return response.data;
};

export const deleteSavingsGoal = async (id) => {
  await api.delete(
    `budgets/savings-goals/${id}/`
  );
};

export const completePurchase = async (goalId, payload) => {
  const response = await api.post(
    `budgets/savings-goals/${goalId}/complete-purchase/`,
    payload
  );

  return response.data;
};