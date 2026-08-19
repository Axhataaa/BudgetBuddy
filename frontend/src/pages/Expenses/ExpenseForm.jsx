import { useEffect, useRef, useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "./expenseConstants";
import { getLocalDateString } from "../../utils/localDate";
import { useTodayLocalDate } from "../../hooks/useTodayLocalDate";

const buildEmptyForm = () => ({
  title: "",
  amount: "",
  category: EXPENSE_CATEGORIES[0],
  payment_method: "UPI",
  date: getLocalDateString(),
  description: "",
});

export default function ExpenseForm({ initialValues, onSubmit, onCancel, submitting }) {
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
    if (!form.title.trim()) next.title = "Title is required.";
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
    onSubmit({ ...form, title: form.title.trim() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input id="expense-title" label="Title" value={form.title} onChange={handleChange("title")} error={errors.title} />

      <div className="row">
        <div className="col-6">
          <Input
            id="expense-amount"
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={handleChange("amount")}
            error={errors.amount}
          />
        </div>
        <div className="col-6">
          <Input
            id="expense-date"
            label="Date"
            type="date"
            value={form.date}
            max={today}
            onChange={handleChange("date")}
            error={errors.date}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-6">
          <Input
            id="expense-category"
            label="Category"
            as="select"
            value={form.category}
            onChange={handleChange("category")}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div className="col-6">
          <Input
            id="expense-payment-method"
            label="Payment Method"
            as="select"
            value={form.payment_method}
            onChange={handleChange("payment_method")}
            options={PAYMENT_METHODS.map((p) => ({ value: p, label: p }))}
          />
        </div>
      </div>

      <Input
        id="expense-description"
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
          Save Expense
        </Button>
      </div>
    </form>
  );
}
