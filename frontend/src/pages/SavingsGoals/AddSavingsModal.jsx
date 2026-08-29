import { useState } from "react";
import { createSavingsTransaction } from "../../services/savingsTransactionService";
import { formatCurrency } from "../../utils/formatCurrency";
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

  if (!goal) return null;

  const remaining = Math.max(
    Number(goal.target_amount) - Number(goal.current_amount),
    0
  );

  async function handleSubmit(e) {
    e.preventDefault();

    if (Number(amount) <= 0) {
      showToast("Please enter a valid amount.", "error");
      return;
    }

    if (Number(amount) > remaining) {
      showToast(
        `Amount cannot exceed the remaining ${formatCurrency(remaining)} needed to reach this goal.`,
        "error"
      );
      return;
    }

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
        <p className="fw-semibold mb-1">{goal.goal_name}</p>

        <small className="text-muted d-block mb-3">
          Remaining to Goal: {formatCurrency(remaining)}
        </small>

        <Input
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          max={remaining}
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
