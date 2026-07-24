import api from "../api/axios";

export const listNotifications = async (params = {}) => {
  const response = await api.get("reports/notifications/", { params });
  return response.data; // { count, next, previous, results }
};

export const markNotificationRead = async (id) => {
  const response = await api.post(`reports/notifications/${id}/mark-read/`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.post("reports/notifications/mark-all-read/");
  return response.data;
};
