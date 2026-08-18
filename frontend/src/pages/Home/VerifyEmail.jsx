import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { LuWallet, LuCircleCheck, LuCircleX } from "react-icons/lu";
import Button from "../../components/ui/Button";
import { verifyEmail } from "../../services/profileService";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("This verification link is missing its token.");
      return;
    }

    let cancelled = false;

    verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((err) => {
        if (cancelled) return;

        const message =
          err.response?.data?.error?.message ||
          "This verification link isn't valid. Please request a new one.";
        setErrorMessage(message);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="bg-surface rounded shadow-token-md p-4 text-center" style={{ width: 380 }}>
        <div className="d-flex align-items-center gap-2 justify-content-center mb-4">
          <LuWallet size={24} className="text-primary" />
          <span className="font-display fs-4 fw-semibold">BudgetBuddy</span>
        </div>

        {status === "loading" && (
          <>
            <span className="spinner-border text-primary mb-3" role="status" aria-hidden="true" />
            <p className="text-muted-ink mb-0">Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <LuCircleCheck size={32} className="text-income mb-3" />
            <p className="fw-semibold mb-1">Email verified successfully.</p>
            <p className="text-muted-ink small mb-3">
              You'll now receive notification emails at this address, based on your preferences in Settings.
            </p>
            <Button variant="primary" className="w-100 justify-content-center" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <LuCircleX size={32} className="text-expense mb-3" />
            <p className="fw-semibold mb-1">Verification failed</p>
            <p className="text-muted-ink small mb-3">{errorMessage}</p>
            <Button variant="secondary" className="w-100 justify-content-center" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
            <p className="text-center small text-muted-ink mt-3 mb-0">
              You can request a new link from <Link to="/settings" className="text-primary">Settings</Link>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
