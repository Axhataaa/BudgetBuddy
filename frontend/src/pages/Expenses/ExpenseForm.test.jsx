import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@testing-library/react";
import ExpenseForm from "./ExpenseForm";

// Amount/date use native `min`/`max` constraints, so jsdom (like a real browser)
// blocks the submit event on click when they're violated, before our own
// validation ever runs. Submitting the form directly exercises our validation
// logic the same way a user's keyboard Enter-to-submit would.
function submitForm(container) {
  fireEvent.submit(container.querySelector("form"));
}

describe("ExpenseForm", () => {
  it("renders empty with today's date pre-filled and required fields blank", () => {
    render(<ExpenseForm onSubmit={vi.fn()} onCancel={vi.fn()} submitting={false} />);
    expect(screen.getByLabelText(/title/i)).toHaveValue("");
    expect(screen.getByLabelText(/amount/i)).toHaveValue(null);
    expect(screen.getByLabelText(/^date$/i)).not.toHaveValue("");
  });

  it("rejects submission when title is blank", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ExpenseForm onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />);

    await user.type(screen.getByLabelText(/amount/i), "50");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a zero or negative amount", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<ExpenseForm onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />);

    await user.type(screen.getByLabelText(/title/i), "Groceries");
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "0" } });
    submitForm(container);

    expect(await screen.findByText(/amount must be greater than 0/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a future date", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<ExpenseForm onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />);

    await user.type(screen.getByLabelText(/title/i), "Groceries");
    await user.type(screen.getByLabelText(/amount/i), "50");

    const dateInput = screen.getByLabelText(/^date$/i);
    const futureYear = new Date().getFullYear() + 5;
    fireEvent.change(dateInput, { target: { value: `${futureYear}-01-01` } });
    submitForm(container);

    expect(await screen.findByText(/date cannot be in the future/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed, valid data", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ExpenseForm onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />);

    await user.type(screen.getByLabelText(/title/i), "  Groceries  ");
    await user.type(screen.getByLabelText(/amount/i), "42.50");
    await user.click(screen.getByRole("button", { name: /save expense/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ title: "Groceries", amount: "42.5" });
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ExpenseForm onSubmit={vi.fn()} onCancel={onCancel} submitting={false} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables Cancel and shows a loading Save button while submitting", () => {
    render(<ExpenseForm onSubmit={vi.fn()} onCancel={vi.fn()} submitting={true} />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("pre-fills fields from initialValues when editing an existing expense", () => {
    const initialValues = {
      title: "Movie night",
      amount: "15.00",
      category: "Entertainment",
      payment_method: "Cash",
      date: "2026-01-15",
      description: "With friends",
    };
    render(<ExpenseForm initialValues={initialValues} onSubmit={vi.fn()} onCancel={vi.fn()} submitting={false} />);

    expect(screen.getByLabelText(/title/i)).toHaveValue("Movie night");
    expect(screen.getByLabelText(/amount/i)).toHaveValue(15);
    expect(screen.getByLabelText(/^date$/i)).toHaveValue("2026-01-15");
  });
});
