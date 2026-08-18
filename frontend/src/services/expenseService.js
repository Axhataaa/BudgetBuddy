import api from "../api/axios";

export const listExpenses = async (params = {}) => {
  const response = await api.get("expenses/", { params });
  return response.data; // { count, next, previous, results }
};

export const createExpense = async (payload) => {
  const response = await api.post("expenses/", payload);
  return response.data;
};

export const updateExpense = async (id, payload) => {
  const response = await api.patch(`expenses/${id}/`, payload);
  return response.data;
};

export const deleteExpense = async (id) => {
  await api.delete(`expenses/${id}/`);
};
