import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LuWallet } from "react-icons/lu";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { registerUser } from "../../services/authService";
import { useToast } from "../../components/ui/Toast";

// Mirrors backend Profile.Role exactly - "premium"/"admin" are
// deliberately absent: Premium is becoming a separate subscription
// concept (not a role), and Admin is granted via Django's own
// is_staff/is_superuser, never self-selected at registration.
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Same client-side confirm-match check as Change Password - the
    // backend re-validates this regardless (RegisterSerializer.validate),
    // this just avoids a round trip for the most common mistake.
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
    <div className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: "100vh" }}>
      <div className="bg-surface rounded shadow-token-md p-4" style={{ width: 460 }}>
        <div className="d-flex align-items-center gap-2 justify-content-center mb-4">
          <LuWallet size={24} className="text-primary" />
          <span className="font-display fs-4 fw-semibold">BudgetBuddy</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-6">
              <Input label="First name" name="first_name" value={formData.first_name} onChange={handleChange} />
            </div>
            <div className="col-6">
              <Input label="Last name" name="last_name" value={formData.last_name} onChange={handleChange} />
            </div>
          </div>

          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <div className="row">
            <div className="col-6">
              <Input
                label="Password"
                type="password"
                name="password"
                showPasswordToggle
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
              />
            </div>
            <div className="col-6">
              <Input
                label="Confirm Password"
                type="password"
                name="confirm_password"
                showPasswordToggle
                value={formData.confirm_password}
                onChange={handleChange}
                error={errors.confirm_password}
              />
            </div>
          </div>

          <Input
            label="Occupation"
            as="select"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={ROLE_OPTIONS}
          />

          <Input
            label="Phone Number (optional)"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
          />

          <Button type="submit" className="w-100 justify-content-center mt-2" loading={submitting}>
            Create account
          </Button>
        </form>

        <p className="text-center small text-muted-ink mt-3 mb-0">
          Already have an account? <Link to="/login" className="text-primary">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
