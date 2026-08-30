import { useEffect, useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function FinancialPreferencesSection({ savingTarget, onSave, loading }) {
  const [draftTarget, setDraftTarget] = useState(savingTarget ?? "");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Sync local draft once the real value arrives from the server.
  useEffect(() => {
    if (savingTarget !== undefined) setDraftTarget(savingTarget);
  }, [savingTarget]);

  const dirty = Number(draftTarget) !== Number(savingTarget);

  const handleSave = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (Number(draftTarget) < 0) nextErrors.target = "Cannot be negative.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await onSave({
        monthly_saving_target: draftTarget,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="financial-preferences" className="bg-surface rounded shadow-token-sm hover-card p-4">
      <h2 className="font-display fs-6 fw-semibold mb-1">Financial Preferences</h2>
      <p className="text-muted-ink small mb-3">
        Set the amount of net savings you want to achieve each month.
      </p>

      {loading ? (
        <span className="placeholder-glow d-block">
          <span className="placeholder col-6" style={{ height: 38 }} />
        </span>
      ) : (
        <form onSubmit={handleSave}>
          <div style={{ maxWidth: 320 }}>
            <Input
              id="monthly-saving-target"
              label="Monthly saving target"
              type="number"
              min="0"
              step="0.01"
              value={draftTarget}
              onChange={(e) => setDraftTarget(e.target.value)}
              error={errors.target}
            />
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
