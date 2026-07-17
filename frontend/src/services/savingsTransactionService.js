import api from "../api/axios";

export const listSavingsTransactions = async (params = {}) => {
  const response = await api.get(
    "budgets/savings-transactions/",
    {
      params,
    }
  );

  return response.data;
};

export const createSavingsTransaction = async (payload) => {
  const response = await api.post(
    "budgets/savings-transactions/",
    payload
  );

  return response.data;
};