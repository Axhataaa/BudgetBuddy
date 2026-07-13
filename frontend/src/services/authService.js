import api from "../api/axios";

export const registerUser = async (userData) => {
  const response = await api.post("users/register/", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("users/login/", credentials);
  return response.data; // { access, refresh }
};

export const logoutUser = async () => {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return;
  // Best-effort - if the network call fails, we still clear local
  // tokens client-side (see AuthContext.logout), so a user is never
  // stuck "logged in" just because the blacklist call didn't land.
  await api.post("users/logout/", { refresh }).catch(() => {});
};