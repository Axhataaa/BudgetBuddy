import { useEffect, useRef, useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { INCOME_SOURCES } from "./incomeConstants";
import { getLocalDateString } from "../../utils/localDate";
import { useTodayLocalDate } from "../../hooks/useTodayLocalDate";

const buildEmptyForm = () => ({
  source: INCOME_SOURCES[0],
  amount: "",
  date: getLocalDateString(),
  description: "",
});

export default function IncomeForm({ initialValues, onSubmit, onCancel, submitting }) {
  const today = useTodayLocalDate();
  const [form, setForm] = useState(initialValues || buildEmptyForm);
  const [errors, setErrors] = useState({});

  // Tracks whether `date` is still the auto-filled "today" value (i.e. the
  // user hasn't deliberately picked a date). Only in that case should the
  // midnight rollover below advance the field automatically; a date the
  // user explicitly selected must never be overwritten.
  const isDateAutoFilled = useRef(!initialValues);

  useEffect(() => {
    if (isDateAutoFilled.current) {
      setForm((prev) => (prev.date === today ? prev : { ...prev, date: today }));
    }
  }, [today]);

  const handleChange = (field) => (e) => {
    if (field === "date") {
      isDateAutoFilled.current = false;
    }
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const next = {};
    if (!form.amount || Number(form.amount) <= 0) next.amount = "Amount must be greater than 0.";
    if (!form.date) next.date = "Date is required.";
    else if (form.date > today) {
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
        max={today}
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
