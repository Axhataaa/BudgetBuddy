import api from "../api/axios";

export const getReportSummary = async ({ date_from, date_to }) => {
  const response = await api.get("reports/summary/", {
    params: { date_from, date_to },
  });
  return response.data;
};
