import { useEffect, useState } from "react";
import {
  createSavingsGoal,
  updateSavingsGoal,
} from "../../services/savingsGoalService";
import { LuTarget } from "react-icons/lu";

function GoalFormModal({
  show,
  onHide,
  goal,
  onSuccess,
}) {
  const isEdit = Boolean(goal);

  const [formData, setFormData] = useState({
    goal_name: "",
    description: "",
    target_amount: "",
    current_amount: 0,
    target_date: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!goal) {
      setFormData({
        goal_name: "",
        description: "",
        target_amount: "",
        current_amount: 0,
        target_date: "",
      });
      return;
    }

    setFormData({
      goal_name: goal.goal_name,
      description: goal.description,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount ?? 0,
      target_date: goal.target_date,
    });
  }, [goal]);

  async function handleSubmit() {
    if (!formData.goal_name.trim()) {
      alert("Goal name is required.");
      return;
    }

    if (!formData.target_amount) {
      alert("Target amount is required.");
      return;
    }

    if (!formData.target_date) {
      alert("Target date is required.");
      return;
    }

    try {
      setSaving(true);

      if (isEdit) {
        await updateSavingsGoal(goal.id, formData);
      } else {
        await createSavingsGoal(formData);
      }

      onSuccess?.();
    } catch (error) {
      console.error(error);

      const apiError = error.response?.data?.error;

      let message =
        apiError?.message || "Failed to save goal.";

      if (apiError?.details) {
        const firstFieldErrors = Object.values(
          apiError.details
        )[0];

        if (
          Array.isArray(firstFieldErrors) &&
          firstFieldErrors.length > 0
        ) {
          message = firstFieldErrors[0];
        }
      }

      alert(message);
    } finally {
      setSaving(false);
    }
  }

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>

      <div
        className="modal fade show d-block"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg">

            {/* Header */}

            <div className="modal-header">

              <h4 className="modal-title d-flex align-items-center">

                <LuTarget className="me-2 text-primary" />

                {isEdit
                  ? "Edit Savings Goal"
                  : "Add Savings Goal"}

              </h4>

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onHide}
              />

            </div>

            {/* Body */}

            <div className="modal-body">

              <div className="row g-3">

                <div className="col-12">

                  <label className="form-label">
                    Goal Name
                  </label>

                  <input
                    className="form-control"
                    value={formData.goal_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goal_name: e.target.value,
                      })
                    }
                  />

                </div>

                <div className="col-12">

                  <label className="form-label">
                    Description
                  </label>

                  <textarea
                    rows={3}
                    className="form-control"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                  />

                </div>

                <div className="col-12">

                  <label className="form-label">
                    Target Amount
                  </label>

                  <input
                    type="number"
                    className="form-control"
                    value={formData.target_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_amount: e.target.value,
                      })
                    }
                  />

                </div>

                <div className="col-md-6">

                  <label className="form-label">
                    Target Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={formData.target_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_date: e.target.value,
                      })
                    }
                  />

                </div>

              </div>

            </div>

            {/* Footer */}

            <div className="modal-footer">

              <button
                className="btn btn-light"
                onClick={onHide}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : isEdit
                  ? "Save Changes"
                  : "Create Goal"}
              </button>

            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default GoalFormModal;