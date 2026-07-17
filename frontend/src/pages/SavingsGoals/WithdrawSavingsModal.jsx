import { useState } from "react";
import { createSavingsTransaction } from "../../services/savingsTransactionService";
import { LuWallet, LuX } from "react-icons/lu";

function WithdrawSavingsModal({
  show,
  onHide,
  goal,
  onSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!show || !goal) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (Number(amount) <= 0) {
      alert("Please enter a valid amount.");
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

      const apiError =
        error.response?.data?.transaction_amount?.[0] ||
        error.response?.data?.detail ||
        "Failed to withdraw savings.";

      alert(apiError);
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
                  ₹{Number(goal.current_amount).toLocaleString()}
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