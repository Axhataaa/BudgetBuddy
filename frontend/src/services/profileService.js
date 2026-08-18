import api from "../api/axios";

export const getProfile = async () => {
  const response = await api.get("users/me/");
  return response.data;
};

export const updateProfile = async (payload) => {
  const isFileUpload = payload.profile_picture instanceof File;

  if (isFileUpload) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value);
    });
    const response = await api.patch("users/me/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  const response = await api.patch("users/me/", payload);
  return response.data;
};

export const changePassword = async (payload) => {
  const response = await api.post("users/change-password/", payload);
  return response.data;
};

export const deleteAccount = async (payload) => {
  const response = await api.post("users/delete-account/", payload);
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await api.post("users/verify-email/", { token });
  return response.data;
};

export const resendVerificationEmail = async () => {
  const response = await api.post("users/resend-verification/");
  return response.data;
};
