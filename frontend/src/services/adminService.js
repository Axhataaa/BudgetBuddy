import api from "../api/axios";

// GET /api/v1/dashboard/admin-stats/ - admin-only monitoring stats
// (total users, occupation distribution, registrations trend,
// per-module record counts, recent users). Same shape as the other
// services in this folder: one thin wrapper around `api`, no
// client-side aggregation - all the counting happens on the backend
// (analytics/views.py AdminStatsView).
export const getAdminStats = async () => {
  const response = await api.get("dashboard/admin-stats/");
  return response.data;
};
