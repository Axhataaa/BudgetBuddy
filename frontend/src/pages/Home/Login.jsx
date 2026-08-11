import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LuWallet } from "react-icons/lu";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { decodeToken } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Routes through AuthContext (not authService directly) so
      // isAuthenticated updates and ProtectedRoute lets us into
      // /expenses immediately - this was the gap flagged in the
      // architecture review: Login previously wrote tokens straight to
      // localStorage with no shared state, so the rest of the app had
      // no way to know a user had logged in.
      const data = await login(formData);

      // Role-based routing: decode the access token directly here
      // (same decodeToken AuthContext itself uses) rather than reading
      // `user` from useAuth() - that context value is only guaranteed
      // fresh on the *next* render after login()'s setAccess() call,
      // so reading it synchronously in this same function could still
      // see the pre-login (null) value. Decoding the just-received
      // token directly avoids that timing gap entirely.
      const claims = decodeToken(data.access);
      navigate(claims?.is_staff || claims?.is_superuser ? "/admin" : "/dashboard");
    } catch {
      showToast("Invalid username or password.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="bg-surface rounded shadow-token-md p-4" style={{ width: 380 }}>
        <div className="d-flex align-items-center gap-2 justify-content-center mb-4">
          <LuWallet size={24} className="text-primary" />
          <span className="font-display fs-4 fw-semibold">BudgetBuddy</span>
        </div>

        <form onSubmit={handleSubmit}>
          <Input label="Username" name="username" value={formData.username} onChange={handleChange} />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          <Button type="submit" className="w-100 justify-content-center mt-2" loading={submitting}>
            Log in
          </Button>
        </form>

        <p className="text-center small text-muted-ink mt-3 mb-0">
          Don't have an account? <Link to="/register" className="text-primary">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
