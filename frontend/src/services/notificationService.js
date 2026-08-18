import api from "../api/axios";

export const listNotifications = async (params = {}) => {
  const response = await api.get("notifications/", { params });
  return response.data; 
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
