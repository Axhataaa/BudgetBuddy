import api from "../api/axios";

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
