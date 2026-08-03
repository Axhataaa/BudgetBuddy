import { useState } from "react";
import { createSavingsTransaction } from "../../services/savingsTransactionService";
import { formatCurrency } from "../../utils/formatCurrency";
import { LuWallet } from "react-icons/lu";
import { useToast } from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

function WithdrawSavingsModal({
  show,
  onHide,
  goal,
  onSuccess,
}) {
  const { showToast } = useToast();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Note: this guard stays here (rather than folding into Modal's own
  // `open` check) because the form below reads goal.goal_name/
  // goal.current_amount - that JSX is evaluated by this component
  // before Modal ever gets to decide whether to render it, so `goal`
  // must be confirmed non-null first regardless of what `show` is.
  if (!goal) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (Number(amount) <= 0) {
      showToast("Please enter a valid amount.", "error");
      return;
    }

    try {
      setSaving(true);

      await createSavingsTransaction({
        goal: goal.id,
        transaction_amount: Number(amount),
        transaction_type: "withdrawal",
        note,
      });

      setAmount("");
      setNote("");

      onSuccess?.();
    } catch (error) {
      console.error(error);

      // Bug fix: this read error.response.data.transaction_amount[0],
      // but the API's actual error shape (config/exceptions.py) nests
      // field errors under data.error.details - so a real "Withdrawal
      // cannot make savings negative" validation failure was silently
      // falling through to the generic message below. Also swapped
      // alert() for the app's toast system for consistency.
      //
      // details.transaction_amount can be either a string (manual
      // `raise ValidationError({"field": "message"})` in this view)
      // or an array (DRF's own field-validator errors), so this
      // normalizes both instead of assuming one shape - `?.[0]` alone
      // would silently grab just the first character of a string.
      const apiError = error.response?.data?.error;
      const firstDetail = (value) => (Array.isArray(value) ? value[0] : value);
      const detail =
        firstDetail(apiError?.details?.transaction_amount) ||
        firstDetail(Object.values(apiError?.details || {})[0]);

      showToast(
        detail || apiError?.message || "Failed to withdraw savings.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={show}
      onClose={onHide}
      title={
        <span className="d-flex align-items-center">
          <LuWallet className="me-2 text-danger" />
          Withdraw Savings
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        <p className="fw-semibold mb-1">{goal.goal_name}</p>

        <small className="text-muted d-block mb-3">
          Available Savings: {formatCurrency(goal.current_amount)}
        </small>

        <Input
          label="Withdrawal Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          max={goal.current_amount}
          required
        />

        <Input
          label="Reason"
          as="textarea"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Bought Laptop"
        />

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="ghost" type="button" onClick={onHide} disabled={saving}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" loading={saving}>
            Withdraw
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default WithdrawSavingsModal;
