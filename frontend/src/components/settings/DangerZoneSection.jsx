import { useState } from "react";
import { LuTriangleAlert } from "react-icons/lu";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import Input from "../ui/Input";
import { useToast } from "../ui/Toast";
import { deleteAccount } from "../../services/profileService";

const METHOD_PASSWORD = "password";
const METHOD_TEXT = "text";

/**
 * Reuses ConfirmDialog (same modal style as Logout, and now portaled
 * to document.body - see components/ui/ConfirmDialog.jsx - so it
 * can't flicker regardless of any hover-transform on this card, the
 * exact bug that affected Logout) via its `children` slot, rather
 * than building a separate confirmation UI for this one action.
 *
 * On success, clears tokens and hard-redirects rather than going
 * through AuthContext's normal logout() (which makes a network call
 * to blacklist the refresh token) - the account and its user row are
 * already gone at that point, so a full reload is the safest way to
 * guarantee every piece of in-memory state (auth, preferences, cached
 * profile data) is wiped cleanly after an irreversible action.
 */
export default function DangerZoneSection() {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [method, setMethod] = useState(METHOD_PASSWORD);
  const [password, setPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setMethod(METHOD_PASSWORD);
    setPassword("");
    setConfirmationText("");
    setError("");
  };

  const canSubmit =
    method === METHOD_PASSWORD ? password.length > 0 : confirmationText === "DELETE";

  const handleConfirm = async () => {
    if (!canSubmit) {
      setError(
        method === METHOD_PASSWORD
          ? "Enter your password to continue."
          : 'Type "DELETE" exactly to continue.'
      );
      return;
    }

    setError("");
    setDeleting(true);
    try {
      await deleteAccount(
        method === METHOD_PASSWORD ? { password } : { confirmation_text: confirmationText }
      );

      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      showToast("Your account has been deleted.", "success");
      window.location.href = "/";
    } catch (err) {
      const details = err.response?.data?.error?.details;
      const message =
        details?.password?.[0] ||
        details?.confirmation_text?.[0] ||
        err.response?.data?.error?.message ||
        "Couldn't delete your account. Please try again.";
      setError(message);
      setDeleting(false);
    }
  };

  return (
    <div id="danger-zone" className="bg-surface rounded shadow-token-sm border border-danger p-4">
      <h2 className="font-display fs-6 fw-semibold mb-1 text-danger d-flex align-items-center gap-2">
        <LuTriangleAlert size={18} />
        Danger Zone
      </h2>
      <p className="text-muted-ink small mb-3">
        Permanently delete your account and all associated data - expenses, income, budgets, savings
        goals and achievements. This action cannot be undone.
      </p>

      <Button
        variant="danger"
        onClick={() => {
          resetForm();
          setConfirmOpen(true);
        }}
      >
        Delete Account
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account permanently?"
        message="All of your data will be permanently deleted. This cannot be undone."
        confirmLabel="Delete My Account"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          resetForm();
        }}
      >
        <div className="mt-3">
          <div className="btn-group btn-group-sm mb-3" role="group">
            <button
              type="button"
              className={`btn ${method === METHOD_PASSWORD ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setMethod(METHOD_PASSWORD);
                setError("");
              }}
            >
              Use password
            </button>
            <button
              type="button"
              className={`btn ${method === METHOD_TEXT ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                setMethod(METHOD_TEXT);
                setError("");
              }}
            >
              Type DELETE
            </button>
          </div>

          {method === METHOD_PASSWORD ? (
            <Input
              type="password"
              showPasswordToggle
              label="Account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
            />
          ) : (
            <Input
              type="text"
              label={'Type "DELETE" to confirm'}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              error={error}
            />
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}
