import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LuWallet, LuUser, LuLock } from "react-icons/lu";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { decodeToken } from "../../context/AuthContext";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";

function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSuccess = async (credential) => {
    try {
      const data = await loginWithGoogle(credential, "login");
      const claims = decodeToken(data.access);
      navigate(claims?.is_staff || claims?.is_superuser ? "/admin" : "/dashboard");
    } catch (error) {
      showToast(error.response?.data?.error?.message || "Google sign-in failed. Please try again.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await login(formData);
      const claims = decodeToken(data.access);
      navigate(claims?.is_staff || claims?.is_superuser ? "/admin" : "/dashboard");
    } catch {
      showToast("Invalid username or password.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center auth-shell">
      <div className="bg-surface rounded shadow-token-md p-4 p-md-5 w-100" style={{ maxWidth: 460 }}>
        <div className="d-flex align-items-center gap-2 justify-content-center mb-3">
          <LuWallet size={24} className="text-primary" />
          <span className="font-display fs-4 fw-semibold">BudgetBuddy</span>
        </div>

        <h1 className="font-display fs-3 fw-bold mb-4">Welcome Back</h1>

        <form onSubmit={handleSubmit}>
          <Input label="Username" name="username" placeholder="Enter your username" icon={LuUser} value={formData.username} onChange={handleChange} />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            icon={LuLock}
            showPasswordToggle
            value={formData.password}
            onChange={handleChange}
          />

          <div className="text-end mt-2">
            <Link to="/forgot-password" className="text-primary small">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-100 justify-content-center mt-3"
            loading={submitting}
          >
            Log in
          </Button>
        </form>

        <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={(message) => showToast(message, "error")} />

        <p className="text-center small text-muted-ink mt-4 mb-0">
          Don't have an account? <Link to="/register" className="text-primary">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;