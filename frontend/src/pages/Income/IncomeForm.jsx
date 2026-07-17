import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { INCOME_SOURCES } from "./incomeConstants";

const emptyForm = {
  source: INCOME_SOURCES[0],
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

export default function IncomeForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initialValues || emptyForm);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Same validation approach as ExpenseForm - mirrors the backend
  // IncomeSerializer's rules for instant feedback, backend re-validates
  // regardless (client-side is UX only, never the integrity boundary).
  const validate = () => {
    const next = {};
    if (!form.amount || Number(form.amount) <= 0) next.amount = "Amount must be greater than 0.";
    if (!form.date) next.date = "Date is required.";
    else if (form.date > new Date().toISOString().slice(0, 10)) {
      next.date = "Date cannot be in the future.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, description: form.description.trim() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-6">
          <Input
            label="Source"
            as="select"
            value={form.source}
            onChange={handleChange("source")}
            options={INCOME_SOURCES.map((s) => ({ value: s, label: s }))}
          />
        </div>
        <div className="col-6">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={handleChange("amount")}
            error={errors.amount}
          />
        </div>
      </div>

      <Input
        label="Date"
        type="date"
        value={form.date}
        onChange={handleChange("date")}
        error={errors.date}
      />

      <Input
        label="Description (optional)"
        as="textarea"
        value={form.description}
        onChange={handleChange("description")}
      />

      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save Income
        </Button>
      </div>
    </form>
  );
}
