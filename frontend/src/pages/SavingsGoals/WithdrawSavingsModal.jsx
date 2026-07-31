import { useState } from "react";
import { createSavingsTransaction } from "../../services/savingsTransactionService";
import { formatCurrency } from "../../utils/formatCurrency";
import { LuWallet, LuX } from "react-icons/lu";
import { useToast } from "../../components/ui/Toast";

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

  if (!show || !goal) return null;

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
    <>
      <div className="modal-backdrop fade show"></div>

      <div className="modal fade show d-block">
        <div className="modal-dialog modal-dialog-centered">

          <div className="modal-content bg-surface">

            <form onSubmit={handleSubmit}>

              <div className="modal-header">

                <h4 className="modal-title d-flex align-items-center">
                  <LuWallet className="me-2 text-danger" />
                  Withdraw Savings
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

                <p className="fw-semibold mb-1">
                  {goal.goal_name}
                </p>

                <small className="text-muted d-block mb-3">
                  Available Savings:
                  {" "}
                  {formatCurrency(goal.current_amount)}
                </small>

                <div className="mb-3">

                  <label className="form-label">
                    Withdrawal Amount
                  </label>

                  <input
                    type="number"
                    className="form-control"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    max={goal.current_amount}
                    required
                  />

                </div>

                <div>

                  <label className="form-label">
                    Reason
                  </label>

                  <textarea
                    rows={3}
                    className="form-control"
                    value={note}
                    onChange={(e) =>
                      setNote(e.target.value)
                    }
                    placeholder="e.g. Bought Laptop"
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
                  className="btn btn-danger"
                  disabled={saving}
                >
                  {saving
                    ? "Withdrawing..."
                    : "Withdraw"}
                </button>

              </div>

            </form>

          </div>

        </div>
      </div>
    </>
  );
}

export default WithdrawSavingsModal;