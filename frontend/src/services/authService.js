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

  await api.post("users/logout/", { refresh }).catch(() => {});
};
export const googleLogin = async (credential) => {
  const response = await api.post("users/google-login/", { credential });
  return response.data;
};
