import { useState } from "react";
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
 * actually makes formatCurrency() convert and render every amount in
 * the app in this currency (see utils/formatCurrency.js,
 * utils/exchangeRates.js, and AppShell.jsx for how that takes effect
 * immediately, not just on the next page load). Persists the choice
 * the same way every other section does, via onSave -> updateProfile;
 * reverts on failure.
 *
 * Renders the <select> directly rather than through the shared Input
 * component: Input's wrapper hardcodes a hierarchy-relative "mb-3
 * ${className}" class string, and since Bootstrap's .mb-3 and .mb-0
 * utility classes have equal CSS specificity, which one wins is
 * decided by their order in Bootstrap's compiled stylesheet (not the
 * order they're listed in the class attribute) - .mb-3 is declared
 * later there, so it silently won over an .mb-0 override passed via
 * `className`, leaving an extra ~1rem of bottom margin under the
 * select that the adjacent Button didn't have, throwing off their
 * alignment. Rendering the control directly here avoids relying on
 * overriding that margin at all.
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

      <form onSubmit={handleSave}>
        <label className="form-label fw-medium" htmlFor="currency-select">
          Preferred currency
        </label>
        <div className="d-flex align-items-stretch gap-2">
          <select
            id="currency-select"
            className="form-select"
            style={{ maxWidth: 260 }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" loading={saving} disabled={!dirty}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
