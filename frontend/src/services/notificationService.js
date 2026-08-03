import api from "../api/axios";

// Backend route moved from /api/v1/reports/notifications/ to its own
// /api/v1/notifications/ app (backend/notifications/urls.py, mounted
// in config/urls.py) as part of extracting notifications out of the
// reports app into their own dedicated app - these are the only
// lines in the frontend that needed to change as a result.

export const listNotifications = async (params = {}) => {
  const response = await api.get("notifications/", { params });
  return response.data; // { count, next, previous, results }
};

export const markNotificationRead = async (id) => {
  const response = await api.post(`notifications/${id}/mark-read/`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.post("notifications/mark-all-read/");
  return response.data;
};

export const deleteNotification = async (id) => {
  await api.delete(`notifications/${id}/`);
};

export const clearAllNotifications = async () => {
  const response = await api.delete("notifications/clear-all/");
  return response.data;
};
