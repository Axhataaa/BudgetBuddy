import api from "../api/axios";

export const listIncomes = async (params = {}) => {
  const response = await api.get("incomes/", { params });
  return response.data;
};

export const createIncome = async (payload) => {
  const response = await api.post("incomes/", payload);
  return response.data;
};

export const updateIncome = async (id, payload) => {
  const response = await api.patch(`incomes/${id}/`, payload);
  return response.data;
};

export const deleteIncome = async (id) => {
  await api.delete(`incomes/${id}/`);
};
