import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { loginUser, logoutUser } from "../services/authService";

const AuthContext = createContext(null);

// Minimal JWT payload decode - just enough to read user_id/exp. Not a
// full verification (the backend is the source of truth for validity);
// this only lets the UI know who's "probably" logged in before the
// first API call confirms it.
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [access, setAccess] = useState(() => localStorage.getItem("access"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  // The axios interceptor (api/axios.js) dispatches this when a refresh
  // attempt fails - AuthContext is the single place that reacts to it,
  // rather than every page individually checking token validity.
  useEffect(() => {
    const handleForcedLogout = () => setAccess(null);
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setAccess(data.access);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setAccess(null);
  }, []);

  const user = useMemo(() => (access ? decodeToken(access) : null), [access]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(access),
      user,
      loading,
      login,
      logout,
    }),
    [access, user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;