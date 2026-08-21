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

export const googleLogin = async (credential, mode = "login") => {
  const response = await api.post("users/google-login/", {
    credential,
    mode,
  });
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post("users/password-reset/", { email });
  return response.data;
};

export const confirmPasswordReset = async (token, newPassword, confirmPassword) => {
  const response = await api.post("users/password-reset/confirm/", {
    token,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
  return response.data;
};
