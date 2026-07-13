import api from "../api/axios";

export const getDashboardSummary = async (params = {}) => {
  const response = await api.get("dashboard/summary/", { params });
  return response.data;
};
