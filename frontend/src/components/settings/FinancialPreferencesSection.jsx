import { useEffect, useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function FinancialPreferencesSection({ savingTarget, warningThreshold, onSave, loading }) {
  const [draftTarget, setDraftTarget] = useState(savingTarget ?? "");
  const [draftThreshold, setDraftThreshold] = useState(warningThreshold ?? 90);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Sync local drafts once the real values arrive from the server.
  useEffect(() => {
    if (savingTarget !== undefined) setDraftTarget(savingTarget);
  }, [savingTarget]);
  useEffect(() => {
    if (warningThreshold !== undefined) setDraftThreshold(warningThreshold);
  }, [warningThreshold]);

  const dirty = Number(draftTarget) !== Number(savingTarget) || Number(draftThreshold) !== Number(warningThreshold);

  const handleSave = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (Number(draftTarget) < 0) nextErrors.target = "Cannot be negative.";
    if (Number(draftThreshold) < 1 || Number(draftThreshold) > 100) {
      nextErrors.threshold = "Must be between 1 and 100.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await onSave({
        monthly_saving_target: draftTarget,
        budget_warning_threshold: draftThreshold,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="financial-preferences" className="bg-surface rounded shadow-token-sm hover-card p-4">
      <h2 className="font-display fs-6 fw-semibold mb-1">Financial Preferences</h2>
      <p className="text-muted-ink small mb-3">
        Fine-tune how BudgetBuddy tracks your savings goal and budget alerts.
      </p>

      {loading ? (
        <>
          <span className="placeholder-glow d-block mb-3">
            <span className="placeholder col-6" style={{ height: 38 }} />
          </span>
          <span className="placeholder-glow d-block">
            <span className="placeholder col-6" style={{ height: 38 }} />
          </span>
        </>
      ) : (
        <form onSubmit={handleSave}>
          <div className="row">
            <div className="col-md-6">
              <Input
                label="Monthly saving target"
                type="number"
                min="0"
                step="0.01"
                value={draftTarget}
                onChange={(e) => setDraftTarget(e.target.value)}
                error={errors.target}
              />
            </div>
            <div className="col-md-6">
              <Input
                label="Budget warning threshold (%)"
                type="number"
                min="1"
                max="100"
                value={draftThreshold}
                onChange={(e) => setDraftThreshold(e.target.value)}
                error={errors.threshold}
              />
              <div className="text-muted-ink small mt-n2 mb-3">
                A budget is flagged "nearing limit" once it crosses this percentage.
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-end">
            <Button type="submit" variant="secondary" loading={saving} disabled={!dirty}>
              Save
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
