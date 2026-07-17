import api from "../api/axios";

/* ==========================
   Budgets
========================== */

export const listBudgets = async (params = {}) => {
  const response = await api.get("budgets/", { params });
  return response.data;
};

export const createBudget = async (payload) => {
  const response = await api.post("budgets/", payload);
  return response.data;
};

export const updateBudget = async (id, payload) => {
  const response = await api.patch(`budgets/${id}/`, payload);
  return response.data;
};

export const deleteBudget = async (id) => {
  await api.delete(`budgets/${id}/`);
};

/* ==========================
   Savings Goals
========================== */

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