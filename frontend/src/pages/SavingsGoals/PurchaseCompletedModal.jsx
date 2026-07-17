import { useEffect, useState } from "react";
import { LuPartyPopper } from "react-icons/lu";
import { completePurchase } from "../../services/savingsGoalService";

function PurchaseCompletedModal({
  show,
  goal,
  onHide,
  onSuccess,
}) {
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

  if (!show || !goal) {
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

      alert(
        error.response?.data?.error ||
        "Failed to complete purchase."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="modal-backdrop fade show"></div>

      <div className="modal fade show d-block">
        <div className="modal-dialog modal-dialog-centered">

          <div className="modal-content">

            <form onSubmit={handleSubmit}>

              <div className="modal-header">

                <h4 className="modal-title d-flex align-items-center">
                  <LuPartyPopper className="me-2 text-success" />
                  Purchase Completed
                </h4>

                <button
                  type="button"
                  className="btn-close"
                  onClick={onHide}
                />

              </div>

              <div className="modal-body">

                <p className="mb-3">
                  Congratulations on purchasing
                  <strong> {goal.goal_name}</strong> 🎉
                </p>

                <div className="mb-3">

                  <label className="form-label">
                    Purchase Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={purchaseDate}
                    onChange={(e) =>
                      setPurchaseDate(e.target.value)
                    }
                  />

                </div>

                <div>

                  <label className="form-label">
                    Purchase Note
                  </label>

                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Bought during Flipkart sale..."
                    value={purchaseNote}
                    onChange={(e) =>
                      setPurchaseNote(e.target.value)
                    }
                  />

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={onHide}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-success"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Complete Purchase"}
                </button>

              </div>

            </form>

          </div>

        </div>
      </div>
    </>
  );
}

export default PurchaseCompletedModal;