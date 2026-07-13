import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "./expenseConstants";

const emptyForm = {
  title: "",
  amount: "",
  category: EXPENSE_CATEGORIES[0],
  payment_method: "UPI",
  date: new Date().toISOString().slice(0, 10),
  description: "",
};

export default function ExpenseForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initialValues || emptyForm);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Client-side validation mirrors the backend's serializer rules
  // (Backend API Design Doc §19) so the user sees the error instantly
  // instead of waiting on a round trip - but the backend re-validates
  // regardless, since client-side checks are a UX convenience, never
  // the actual security/integrity boundary (that's server-side, always).
  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required.";
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
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input label="Title" value={form.title} onChange={handleChange("title")} error={errors.title} />

      <div className="row">
        <div className="col-6">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={handleChange("amount")}
            error={errors.amount}
          />
        </div>
        <div className="col-6">
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={handleChange("date")}
            error={errors.date}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-6">
          <Input
            label="Category"
            as="select"
            value={form.category}
            onChange={handleChange("category")}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div className="col-6">
          <Input
            label="Payment Method"
            as="select"
            value={form.payment_method}
            onChange={handleChange("payment_method")}
            options={PAYMENT_METHODS.map((p) => ({ value: p, label: p }))}
          />
        </div>
      </div>

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
          Save Expense
        </Button>
      </div>
    </form>
  );
}
