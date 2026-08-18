import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}
