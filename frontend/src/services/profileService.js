import api from "../api/axios";

export const getProfile = async () => {
  const response = await api.get("users/me/");
  return response.data;
};

// FormData is required when profile_picture is included (multipart);
// plain JSON works for text-only fields too since the backend's
// ProfileView accepts both (MultiPartParser + FormParser + JSONParser).
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

// AllowAny on the backend - a freshly registered user clicking the
// link in their inbox may have no active session in that browser, so
// this deliberately doesn't require auth. The token itself is what
// proves the request is legitimate.
export const verifyEmail = async (token) => {
  const response = await api.post("users/verify-email/", { token });
  return response.data;
};

// Always uses the caller's own current session - no email address is
// ever passed in, matching the backend's own "always request.user.email"
// guarantee (users/views.py ResendVerificationEmailView).
export const resendVerificationEmail = async () => {
  const response = await api.post("users/resend-verification/");
  return response.data;
};
