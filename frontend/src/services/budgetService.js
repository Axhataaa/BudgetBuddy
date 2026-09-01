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

// Per-budget usage_percentage / alert_level, computed server-side by the
// existing BudgetViewSet.summary action. Used on the Expenses page to
// detect 80/90/100 threshold crossings for the toast warnings.
//
// Optional `params` (category/month/year) scope the summary to one exact
// budget — the backend now applies its normal BudgetFilter to this action,
// so passing all three returns just that budget's row, never a different
// period's. Called with no params, this returns every budget as before.
export const getBudgetsSummary = async (params = {}) => {
  const response = await api.get("budgets/summary/", { params });
  return response.data;
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