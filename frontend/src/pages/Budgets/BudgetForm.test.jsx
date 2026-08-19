import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@testing-library/react";
import BudgetForm from "./BudgetForm";

function submitForm(container) {
  fireEvent.submit(container.querySelector("form"));
}

describe("BudgetForm", () => {
  it("renders category, monthly limit, month and year fields", () => {
    render(<BudgetForm onSubmit={vi.fn()} onCancel={vi.fn()} submitting={false} />);
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly limit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^month$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^year$/i)).toBeInTheDocument();
  });

  it("rejects a zero or missing monthly limit", async () => {
    const onSubmit = vi.fn();
    const { container } = render(<BudgetForm onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />);

    submitForm(container);

    expect(await screen.findByText(/monthly limit must be greater than 0/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid data with month/year coerced to numbers", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BudgetForm onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />);

    await user.type(screen.getByLabelText(/monthly limit/i), "5000");
    await user.click(screen.getByRole("button", { name: /save budget/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.monthly_limit).toBe("5000");
    expect(typeof submitted.month).toBe("number");
    expect(typeof submitted.year).toBe("number");
  });

  it("pre-fills fields from initialValues when editing an existing budget", () => {
    const initialValues = { category: "Food", monthly_limit: "8000", month: 3, year: 2026 };
    render(<BudgetForm initialValues={initialValues} onSubmit={vi.fn()} onCancel={vi.fn()} submitting={false} />);

    expect(screen.getByLabelText(/monthly limit/i)).toHaveValue(8000);
    expect(screen.getByLabelText(/^year$/i)).toHaveValue(2026);
  });
});
