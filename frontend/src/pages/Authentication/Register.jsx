import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LuWallet } from "react-icons/lu";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { registerUser } from "../../services/authService";
import { useToast } from "../../components/ui/Toast";

function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerUser(formData);
      showToast("Registration successful — please log in.", "success");
      navigate("/");
    } catch (error) {
      const details = error.response?.data?.error?.details || error.response?.data;
      const firstError = details ? Object.values(details)[0]?.[0] : null;
      showToast(firstError || "Registration failed. Please check your details.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="bg-surface rounded shadow-token-md p-4" style={{ width: 420 }}>
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
          <Input label="Username" name="username" value={formData.username} onChange={handleChange} />
          <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          <Button type="submit" className="w-100 justify-content-center mt-2" loading={submitting}>
            Create account
          </Button>
        </form>

        <p className="text-center small text-muted-ink mt-3 mb-0">
          Already have an account? <Link to="/" className="text-primary">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
