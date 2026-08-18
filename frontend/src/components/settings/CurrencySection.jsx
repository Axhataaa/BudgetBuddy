import { useState } from "react";
import Button from "../ui/Button";
import { usePreferences } from "../../hooks/usePreferences";

const CURRENCY_OPTIONS = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "KRW", label: "South Korean Won (₩)" },
  { value: "CNY", label: "Chinese Yuan (¥)" },
];

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
