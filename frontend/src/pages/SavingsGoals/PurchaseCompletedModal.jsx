import { useEffect, useState } from "react";
import { LuPartyPopper } from "react-icons/lu";
import { completePurchase } from "../../services/savingsGoalService";
import { useToast } from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

function PurchaseCompletedModal({
  show,
  goal,
  onHide,
  onSuccess,
}) {
  const { showToast } = useToast();
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseNote, setPurchaseNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) {
      setPurchaseDate(
        new Date().toISOString().split("T")[0]
      );
      setPurchaseNote("");
    }
  }, [show]);

  // Note: this guard stays here (rather than folding into Modal's own
  // `open` check) because the form below reads goal.goal_name - that
  // JSX is evaluated by this component before Modal ever gets to
  // decide whether to render it, so `goal` must be confirmed non-null
  // first regardless of what `show` is. Kept after the useEffect
  // above, same as before, since hooks can't follow an early return.
  if (!goal) {
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await completePurchase(goal.id, {
        purchase_date: purchaseDate,
        purchase_note: purchaseNote,
      });

      onSuccess?.();
    } catch (error) {
      console.error(error);

      // Bug fix: alert() replaced with the app's toast system for
      // consistency with every other modal - the extraction here was
      // already correct as-is: complete-purchase's business-logic
      // errors (budgets/views.py) return a raw {"error": "message"}
      // Response() directly rather than raising a ValidationError, so
      // they bypass the wrapped {error:{message,details}} shape the
      // other savings modals need to account for.
      showToast(
        error.response?.data?.error ||
        "Failed to complete purchase.",
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
          <LuPartyPopper className="me-2 text-success" />
          Purchase Completed
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        <p className="mb-3">
          Congratulations on purchasing
          <strong> {goal.goal_name}</strong> 🎉
        </p>

        <Input
          label="Purchase Date"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />

        <Input
          label="Purchase Note"
          as="textarea"
          rows={3}
          placeholder="Bought during Flipkart sale..."
          value={purchaseNote}
          onChange={(e) => setPurchaseNote(e.target.value)}
        />

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="ghost" type="button" onClick={onHide} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Complete Purchase
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default PurchaseCompletedModal;
