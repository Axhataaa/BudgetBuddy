import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { loginUser, googleLogin, logoutUser } from "../services/authService";

const AuthContext = createContext(null);

export function decodeToken(token) {
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

  const loginWithGoogle = useCallback(async (credential) => {
    const data = await googleLogin(credential);
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
  const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(access),
      isAdmin,
      user,
      loading,
      login,
      loginWithGoogle,
      logout,
    }),
    [access, isAdmin, user, loading, login, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;