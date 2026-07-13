import api from "../api/axios";

/**
 * All list params (page, search, category, payment_method, date_from,
 * date_to, ordering) map 1:1 to the query params defined in the
 * Backend API Design Document §13-16 - this file doesn't invent its
 * own naming, it just forwards what the approved contract specifies.
 */
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
