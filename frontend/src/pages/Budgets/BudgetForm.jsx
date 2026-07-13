import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
// Reusing the Expenses module's category list rather than duplicating
// it - Budget.category is a free-text field at the DB level, but the
// Dashboard's budget_utilization join only works if a budget's category
// string exactly matches an expense's category string, so the frontend
// constrains input to the same set rather than letting them drift apart.
import { EXPENSE_CATEGORIES } from "../Expenses/expenseConstants";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const today = new Date();

const emptyForm = {
  category: EXPENSE_CATEGORIES[0],
  monthly_limit: "",
  month: today.getMonth() + 1,
  year: today.getFullYear(),
};

export default function BudgetForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initialValues || emptyForm);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const next = {};
    if (!form.monthly_limit || Number(form.monthly_limit) <= 0) {
      next.monthly_limit = "Monthly limit must be greater than 0.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, month: Number(form.month), year: Number(form.year) });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Category"
        as="select"
        value={form.category}
        onChange={handleChange("category")}
        options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
      />

      <Input
        label="Monthly Limit"
        type="number"
        step="0.01"
        value={form.monthly_limit}
        onChange={handleChange("monthly_limit")}
        error={errors.monthly_limit}
      />

      <div className="row">
        <div className="col-6">
          <Input
            label="Month"
            as="select"
            value={form.month}
            onChange={handleChange("month")}
            options={MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }))}
          />
        </div>
        <div className="col-6">
          <Input label="Year" type="number" value={form.year} onChange={handleChange("year")} />
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save Budget
        </Button>
      </div>
    </form>
  );
}
