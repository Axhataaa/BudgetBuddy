import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Guards /admin the same way ProtectedRoute guards the rest of the
 * app, plus one extra check: even an authenticated Normal User must
 * not reach the Admin Dashboard by typing the URL directly (login-time
 * redirect alone only covers the moment right after logging in, not
 * direct navigation or browser back/forward).
 *
 * Non-admins are sent to /dashboard, not "/" - they ARE authenticated,
 * just not authorized for this specific route, so redirecting to the
 * public landing page would be wrong (and would immediately bounce
 * them right back into the app via ProtectedRoute's own
 * isAuthenticated check).
 */
export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;
  // Same reasoning as ProtectedRoute.jsx: this is also where an admin
  // lands right after clicking Logout (AdminDashboard.jsx's own
  // navigate("/") after logout() agrees with this same destination,
  // so there's no flicker between two different targets).
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}
