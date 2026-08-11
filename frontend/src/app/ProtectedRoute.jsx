import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  // Sends an unauthenticated visitor to the public Landing Page ("/"),
  // not straight to the login form. This is also what a user actually
  // sees right after logging out: AuthContext's logout() only clears
  // the token and doesn't navigate anywhere itself, so whatever this
  // redirect target is becomes the de facto post-logout destination
  // for any page wrapped in ProtectedRoute (e.g. Settings' Log Out
  // button, or a forced logout from an expired session).
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return children;
}
