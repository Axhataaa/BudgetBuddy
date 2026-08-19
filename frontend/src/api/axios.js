import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach the access token to every request
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");

  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }

  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || originalRequest._retried) {
      return Promise.reject(error);
    }

    const refresh = localStorage.getItem("refresh");

    if (!refresh) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE_URL}users/refresh/`, { refresh })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const { data } = await refreshPromise;

      localStorage.setItem("access", data.access);

      if (data.refresh) {
        localStorage.setItem("refresh", data.refresh);
      }

      originalRequest.headers.Authorization = `Bearer ${data.access}`;

      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      window.dispatchEvent(new Event("auth:logout"));

      return Promise.reject(refreshError);
    }
  }
);

export default api;