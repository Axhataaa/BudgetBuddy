import { useEffect, useState } from "react";
import {
  createSavingsGoal,
  updateSavingsGoal,
} from "../../services/savingsGoalService";
import { LuTarget } from "react-icons/lu";
import { useToast } from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { getLocalDateString } from "../../utils/localDate";

function GoalFormModal({
  show,
  onHide,
  goal,
  onSuccess,
}) {
  const { showToast } = useToast();
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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.goal_name.trim()) {
      showToast("Goal name is required.", "error");
      return;
    }

    if (!formData.target_amount) {
      showToast("Target amount is required.", "error");
      return;
    }

    if (!formData.target_date) {
      showToast("Target date is required.", "error");
      return;
    }

    if (!isEdit && formData.target_date < getLocalDateString()) {
      showToast("Target date must be in the future.", "error");
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
        } else if (typeof firstFieldErrors === "string") {
          message = firstFieldErrors;
        }
      }

      showToast(message, "error");
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
          <LuTarget className="me-2 text-primary" />
          {isEdit ? "Edit Savings Goal" : "Add Savings Goal"}
        </span>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-12">
            <Input
              label="Goal Name"
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
            <Input
              label="Description"
              as="textarea"
              rows={3}
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
            <Input
              label="Target Amount"
              type="number"
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
            <Input
              label="Target Date"
              type="date"
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

        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="ghost" type="button" onClick={onHide} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Save Changes" : "Create Goal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default GoalFormModal;
