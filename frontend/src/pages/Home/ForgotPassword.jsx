import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LuWallet, LuMail } from "react-icons/lu";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { requestPasswordReset } from "../../services/authService";
import { useToast } from "../../components/ui/Toast";

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const fromSettings = searchParams.get("source") === "settings";

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      showToast(
        error.response?.data?.error?.message ||
          "Unable to process your request. Please try again.",
        "error"
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

        {!sent ? (
          <>
            <h1 className="font-display fs-3 fw-bold mb-2">
              Forgot Password?
            </h1>

            <p className="text-muted-ink small mb-4">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="name@example.com"
                icon={LuMail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                className="w-100 justify-content-center mt-3"
                loading={submitting}
              >
                Send reset link
              </Button>
            </form>

            <p className="text-center small text-muted-ink mt-4 mb-0">
              Remember your password?{" "}
              <Link to="/login" className="text-primary">
                Log in
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display fs-3 fw-bold mb-2">
              Check your email
            </h1>

            <p className="text-muted-ink small mb-4">
            {fromSettings
                ? `A password reset link has been sent to ${email}. Use the link in your email to set a new password.`
                : `If an account exists with ${email}, a password reset link has been sent.`}
            </p>

            <Button
              variant="secondary"
              className="w-100 justify-content-center"
              onClick={() => setSent(false)}
            >
              Try another email
            </Button>

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