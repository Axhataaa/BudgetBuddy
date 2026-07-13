import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1/",
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Request interceptor: attach the access token to every request ---
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// --- Response interceptor: on a 401, try refreshing once, then retry ---
// the original request. If refresh also fails, clear tokens and let the
// caller (AuthContext) redirect to /login - this file has no knowledge
// of routing, it only owns the HTTP/token mechanics per Backend API
// Design Doc §9.
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
      // Multiple simultaneous 401s should trigger exactly one refresh
      // call, not one per failed request - refreshPromise is shared and
      // cleared once it settles.
      if (!refreshPromise) {
        refreshPromise = axios
          .post("http://127.0.0.1:8000/api/v1/users/refresh/", { refresh })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const { data } = await refreshPromise;
      localStorage.setItem("access", data.access);
      if (data.refresh) {
        // Present when ROTATE_REFRESH_TOKENS is enabled (it is - see
        // Backend API Design Doc §9's resolved decision).
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