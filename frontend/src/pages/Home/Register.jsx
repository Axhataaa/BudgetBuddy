import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LuWallet, LuUser, LuMail, LuLock, LuTag, LuPhone } from "react-icons/lu";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { registerUser } from "../../services/authService";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import { useAuth } from "../../hooks/useAuth";
import { decodeToken } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "working_professional", label: "Working Professional" },
  { value: "freelancer", label: "Freelancer" },
  { value: "business_owner", label: "Business Owner" },
  { value: "other", label: "Other" },
];

function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    role: ROLE_OPTIONS[0].value,
    phone_number: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleSuccess = async (credential) => {
    try {
      const data = await loginWithGoogle(credential);
      const claims = decodeToken(data.access);
      navigate(claims?.is_staff || claims?.is_superuser ? "/admin" : "/dashboard");
    } catch (error) {
      showToast(error.response?.data?.error?.message || "Google sign-up failed. Please try again.", "error");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      setErrors({ confirm_password: "Passwords do not match." });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await registerUser(formData);
      showToast("Registration successful — please log in.", "success");
      navigate("/login");
    } catch (error) {
      const details = error.response?.data?.error?.details || error.response?.data;
      if (details && typeof details === "object") {
        setErrors(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v?.[0] || v])));
      }
      const firstError = details ? Object.values(details)[0]?.[0] || Object.values(details)[0] : null;
      showToast(firstError || "Registration failed. Please check your details.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center py-5 auth-shell">
      <div className="bg-surface rounded shadow-token-md p-4 p-md-5 w-100" style={{ maxWidth: 520 }}>
        <div className="d-flex align-items-center gap-2 justify-content-center mb-3">
          <LuWallet size={24} className="text-primary" />
          <span className="font-display fs-4 fw-semibold">BudgetBuddy</span>
        </div>

        <h1 className="font-display fs-3 fw-bold mb-4">Create account</h1>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <Input label="First name" name="first_name" placeholder="First name" icon={LuTag} value={formData.first_name} onChange={handleChange} />
            </div>
            <div className="col-12 col-sm-6">
              <Input label="Last name" name="last_name" placeholder="Last name" icon={LuTag} value={formData.last_name} onChange={handleChange} />
            </div>
          </div>

          <Input label="Username" name="username" placeholder="Choose a username" icon={LuUser} value={formData.username} onChange={handleChange} error={errors.username} />
          <Input label="Email" type="email" name="email" placeholder="name@example.com" icon={LuMail} value={formData.email} onChange={handleChange} error={errors.email} />

          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <Input label="Password" type="password" name="password" placeholder="At least 6 characters" icon={LuLock} showPasswordToggle value={formData.password} onChange={handleChange} error={errors.password} />
            </div>
            <div className="col-12 col-sm-6">
              <Input label="Confirm Password" type="password" name="confirm_password" placeholder="Re-enter password" icon={LuLock} showPasswordToggle value={formData.confirm_password} onChange={handleChange} error={errors.confirm_password} />
            </div>
          </div>

          <Input label="Occupation" as="select" name="role" value={formData.role} onChange={handleChange} options={ROLE_OPTIONS} />
          <Input label="Phone Number (optional)" name="phone_number" icon={LuPhone} value={formData.phone_number} onChange={handleChange} />

          <Button type="submit" className="w-100 justify-content-center mt-3" loading={submitting}>
            Create account
          </Button>
        </form>

        <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={(message) => showToast(message, "error")} />

        <p className="text-center small text-muted-ink mt-4 mb-0">
          Already have an account? <Link to="/login" className="text-primary">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;