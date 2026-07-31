import { useState } from "react";
import { createSavingsTransaction } from "../../services/savingsTransactionService";
import { LuPiggyBank, LuX } from "react-icons/lu";
import { useToast } from "../../components/ui/Toast";

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

  if (!show || !goal) return null;

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
    <>
      <div className="modal-backdrop fade show"></div>

      <div className="modal fade show d-block">
        <div className="modal-dialog modal-dialog-centered">

          <div className="modal-content bg-surface">

            <form onSubmit={handleSubmit}>

              <div className="modal-header">

                <h4 className="modal-title d-flex align-items-center">
                  <LuPiggyBank className="me-2 text-income" />
                  Add Savings
                </h4>

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={onHide}
                >
                  <LuX />
                </button>

              </div>

              <div className="modal-body">

                <p className="fw-semibold mb-3">
                  {goal.goal_name}
                </p>

                <div className="mb-3">

                  <label className="form-label">
                    Amount
                  </label>

                  <input
                    type="number"
                    className="form-control"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    required
                  />

                </div>

                <div>

                  <label className="form-label">
                    Note
                  </label>

                  <textarea
                    rows={3}
                    className="form-control"
                    value={note}
                    onChange={(e) =>
                      setNote(e.target.value)
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
                    : "Add Savings"}
                </button>

              </div>

            </form>

          </div>

        </div>
      </div>
    </>
  );
}

export default AddSavingsModal;