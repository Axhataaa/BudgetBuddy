import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@testing-library/react";
import IncomeForm from "./IncomeForm";

// Amount/date use native `min`/`max` constraints, so jsdom (like a real browser)
// blocks the submit event on click when they're violated. Submitting the form
// directly exercises our own validation the same way Enter-to-submit would.
function submitForm(container) {
  fireEvent.submit(container.querySelector("form"));
}

describe("IncomeForm", () => {
  it("renders with today's date pre-filled", () => {
    render(<IncomeForm onSubmit={vi.fn()} onCancel={vi.fn()} submitting={false} />);
    expect(screen.getByLabelText(/amount/i)).toHaveValue(null);
    expect(screen.getByLabelText(/^date$/i)).not.toHaveValue("");
  });

  it("rejects a zero or negative amount", async () => {
    const onSubmit = vi.fn();
    const { container } = render(<IncomeForm onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "0" } });
    submitForm(container);

    expect(await screen.findByText(/amount must be greater than 0/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a future date", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<IncomeForm onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />);

    await user.type(screen.getByLabelText(/amount/i), "1000");
    const futureYear = new Date().getFullYear() + 5;
    fireEvent.change(screen.getByLabelText(/^date$/i), { target: { value: `${futureYear}-01-01` } });
    submitForm(container);

    expect(await screen.findByText(/date cannot be in the future/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid data with a trimmed description", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<IncomeForm onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />);

    await user.type(screen.getByLabelText(/amount/i), "5000");
    await user.type(screen.getByLabelText(/description/i), "  Freelance payment  ");
    await user.click(screen.getByRole("button", { name: /save income/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ amount: "5000", description: "Freelance payment" });
  });

  it("pre-fills fields from initialValues when editing", () => {
    const initialValues = { source: "Salary", amount: "3000", date: "2026-02-01", description: "Monthly" };
    render(<IncomeForm initialValues={initialValues} onSubmit={vi.fn()} onCancel={vi.fn()} submitting={false} />);

    expect(screen.getByLabelText(/amount/i)).toHaveValue(3000);
    expect(screen.getByLabelText(/^date$/i)).toHaveValue("2026-02-01");
  });
});
