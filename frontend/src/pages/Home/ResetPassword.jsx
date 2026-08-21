import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LuWallet, LuLock } from "react-icons/lu";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { confirmPasswordReset } from "../../services/authService";
import { useToast } from "../../components/ui/Toast";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirm_password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setErrorMessage("This password reset link is missing its token.");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
        await confirmPasswordReset(
            token,
            formData.password,
            formData.confirm_password
        );

        localStorage.setItem(
            "budgetbuddy:password-reset",
           Date.now().toString()
        );

        setSuccess(true);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error?.message ||
          "This password reset link is invalid or has expired."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center auth-shell">
      <div
        className="bg-surface rounded shadow-token-md p-4 p-md-5 w-100"
        style={{ maxWidth: 460 }}
      >
        <div className="d-flex align-items-center gap-2 justify-content-center mb-3">
          <LuWallet size={24} className="text-primary" />
          <span className="font-display fs-4 fw-semibold">BudgetBuddy</span>
        </div>

        {success ? (
          <>
            <h1 className="font-display fs-3 fw-bold mb-2">
              Password updated
            </h1>

            <p className="text-muted-ink small mb-4">
              Your password has been reset successfully. You can now log in
              with your new password.
            </p>

            <Button
              className="w-100 justify-content-center"
              onClick={() => navigate("/login")}
            >
              Go to login
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-display fs-3 fw-bold mb-2">
              Reset Password
            </h1>

            <p className="text-muted-ink small mb-4">
              Choose a new password for your BudgetBuddy account.
            </p>

            {errorMessage && (
              <div className="alert alert-danger small mb-3">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                label="New Password"
                type="password"
                name="password"
                placeholder="Enter your new password"
                icon={LuLock}
                showPasswordToggle
                value={formData.password}
                onChange={handleChange}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirm_password"
                placeholder="Re-enter your new password"
                icon={LuLock}
                showPasswordToggle
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />

              <Button
                type="submit"
                className="w-100 justify-content-center mt-3"
                loading={submitting}
              >
                Reset password
              </Button>
            </form>

            <p className="text-center small text-muted-ink mt-4 mb-0">
              <Link to="/login" className="text-primary">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}