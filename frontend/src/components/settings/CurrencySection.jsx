import { useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { usePreferences } from "../../hooks/usePreferences";

// Mirrors backend Profile.Currency choices exactly.
const CURRENCY_OPTIONS = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
];

/**
 * Reads/writes the currency through PreferencesContext, which is what
 * actually makes formatCurrency() render every amount in the app in
 * this currency (see utils/formatCurrency.js and AppShell.jsx for how
 * that takes effect immediately, not just on the next page load).
 * Persists the choice the same way every other section does, via
 * onSave -> updateProfile; reverts on failure.
 */
export default function CurrencySection({ onSave }) {
  const { currency, setCurrency } = usePreferences();
  const [draft, setDraft] = useState(currency);
  const [saving, setSaving] = useState(false);

  const dirty = draft !== currency;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!dirty) return;
    const previousCurrency = currency;
    setCurrency(draft);
    setSaving(true);
    try {
      await onSave({ currency: draft });
    } catch {
      setCurrency(previousCurrency);
      setDraft(previousCurrency);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="currency" className="bg-surface rounded shadow-token-sm hover-card p-4">
      <h2 className="font-display fs-6 fw-semibold mb-1">Currency</h2>
      <p className="text-muted-ink small mb-3">Amounts across BudgetBuddy will display in this currency.</p>

      <form onSubmit={handleSave} className="d-flex align-items-end gap-2 flex-wrap">
        <div style={{ minWidth: 240 }}>
          <Input
            as="select"
            label="Preferred currency"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            options={CURRENCY_OPTIONS}
            className="mb-0"
          />
        </div>
        <Button type="submit" variant="secondary" loading={saving} disabled={!dirty}>
          Save
        </Button>
      </form>
    </div>
  );
}
