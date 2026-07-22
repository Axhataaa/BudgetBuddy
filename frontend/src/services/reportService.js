import api from "../api/axios";

/**
 * Single aggregate call - date_from/date_to map directly to the
 * ?date_from=&date_to= params already validated by
 * reports/serializers.py's ReportQuerySerializer on the backend.
 */
export const getReportSummary = async ({ date_from, date_to }) => {
  const response = await api.get("reports/summary/", {
    params: { date_from, date_to },
  });
  return response.data;
};
