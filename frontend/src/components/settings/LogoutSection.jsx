import { useState } from "react";
import { LuLogOut } from "react-icons/lu";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useAuth } from "../../hooks/useAuth";

export default function LogoutSection() {
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div id="logout" className="bg-surface rounded shadow-token-sm hover-card p-4">
      <h2 className="font-display fs-6 fw-semibold mb-1">Log Out</h2>
      <p className="text-muted-ink small mb-3">You'll need to sign in again to access your account.</p>

      <Button variant="danger" icon={LuLogOut} onClick={() => setConfirmOpen(true)}>
        Log Out
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out of BudgetBuddy?"
        message="You'll be returned to the home page."
        confirmLabel="Log Out"
        variant="danger"
        loading={loggingOut}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
