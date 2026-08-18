import api from "../api/axios";

export const getAIFinancialAnalysis = async ({ date_from, date_to, refresh = false }) => {
  const response = await api.post("ai-analysis/analyze/", { date_from, date_to, refresh });
  return response.data;
};
