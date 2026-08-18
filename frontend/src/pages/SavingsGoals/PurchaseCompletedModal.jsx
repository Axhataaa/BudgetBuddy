import { useEffect, useState } from "react";
import { LuPartyPopper } from "react-icons/lu";
import { completePurchase } from "../../services/savingsGoalService";
import { useToast } from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { getLocalDateString } from "../../utils/localDate";

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
      setPurchaseDate(getLocalDateString());
      setPurchaseNote("");
    }
  }, [show]);

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
