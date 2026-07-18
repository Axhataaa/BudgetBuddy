import api from "../api/axios";

export const getDashboardSummary = async (params = {}) => {
  const response = await api.get(
    "dashboard/summary/",
    {
      params,
    }
  );

  return response.data;
};

export const getRecentActivity = async (params = {}) => {
  const response = await api.get(
    "dashboard/recent-activity/",
    {
      params,
    }
  );

  return response.data;
};