import { useEffect, useState } from "react";
import { LuPartyPopper } from "react-icons/lu";
import { completePurchase, completeGoal } from "../../services/savingsGoalService";
import { isPurchaseGoal } from "../../utils/goalType";
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

  const isPurchase = isPurchaseGoal(goal);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      if (isPurchase) {
        await completePurchase(goal.id, {
          purchase_date: purchaseDate,
          purchase_note: purchaseNote,
        });
      } else {
        await completeGoal(goal.id, {
          completion_date: purchaseDate,
          completion_note: purchaseNote,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error(error);

      showToast(
        error.response?.data?.error ||
        (isPurchase
          ? "Failed to complete purchase."
          : "Failed to complete savings goal."),
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
          {isPurchase ? "Purchase Completed" : "Savings Goal Completed"}
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        <p className="mb-3">
          {isPurchase ? (
            <>
              Congratulations on purchasing
              <strong> {goal.goal_name}</strong> 🎉
            </>
          ) : (
            <>
              Congratulations on completing
              <strong> {goal.goal_name}</strong> 🎉
            </>
          )}
        </p>

        <Input
          label={isPurchase ? "Purchase Date" : "Completion Date"}
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />

        <Input
          label={isPurchase ? "Purchase Note" : "Completion Note"}
          as="textarea"
          rows={3}
          placeholder={
            isPurchase
              ? "Bought during Flipkart sale..."
              : "Any notes about reaching this goal..."
          }
          value={purchaseNote}
          onChange={(e) => setPurchaseNote(e.target.value)}
        />

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="ghost" type="button" onClick={onHide} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isPurchase ? "Complete Purchase" : "Complete Savings Goal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default PurchaseCompletedModal;
