import { useState } from "react";
import { createSavingsTransaction } from "../../services/savingsTransactionService";
import { LuPiggyBank } from "react-icons/lu";
import { useToast } from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

function AddSavingsModal({
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
  // `open` check) because the form below reads goal.goal_name - that
  // JSX is evaluated by this component before Modal ever gets to
  // decide whether to render it, so `goal` must be confirmed non-null
  // first regardless of what `show` is.
  if (!goal) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await createSavingsTransaction({
        goal: goal.id,
        transaction_amount: Number(amount),
        transaction_type: "deposit",
        note,
      });

      setAmount("");
      setNote("");

      onSuccess?.();
    } catch (error) {
      console.error(error);

      // Bug fix: this used window.alert(), a blocking native dialog
      // inconsistent with the toast pattern used everywhere else in
      // the app (Expenses, Income, etc.) - also surface the first
      // field-level validation detail when the generic message alone
      // ("Please fix the highlighted fields.") wouldn't explain why.
      // A details value can be a string (manual dict-raise) or an
      // array (DRF's own field-validator errors), so this normalizes
      // both rather than assuming one shape.
      const apiError = error.response?.data?.error;
      const firstValue = Object.values(apiError?.details || {})[0];
      const detail = Array.isArray(firstValue) ? firstValue[0] : firstValue;
      showToast(
        detail || apiError?.message || "Failed to add savings.",
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
          <LuPiggyBank className="me-2 text-income" />
          Add Savings
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        <p className="fw-semibold mb-3">{goal.goal_name}</p>

        <Input
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Input
          label="Note"
          as="textarea"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="ghost" type="button" onClick={onHide} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Add Savings
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddSavingsModal;
