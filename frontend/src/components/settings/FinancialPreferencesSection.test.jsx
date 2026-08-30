import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@testing-library/react";
import FinancialPreferencesSection from "./FinancialPreferencesSection";

describe("FinancialPreferencesSection", () => {
  it("only shows the monthly saving target field, not a budget warning threshold", () => {
    render(<FinancialPreferencesSection savingTarget="5000" onSave={vi.fn()} loading={false} />);

    expect(screen.getByLabelText(/monthly saving target/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/budget warning threshold/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nearing limit/i)).not.toBeInTheDocument();
  });

  it("describes the target as net savings, not a budget or account balance", () => {
    render(<FinancialPreferencesSection savingTarget="5000" onSave={vi.fn()} loading={false} />);

    expect(screen.getByText(/net savings you want to achieve each month/i)).toBeInTheDocument();
  });

  it("saves only monthly_saving_target, never budget_warning_threshold", async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    render(<FinancialPreferencesSection savingTarget="5000" onSave={onSave} loading={false} />);

    const input = screen.getByLabelText(/monthly saving target/i);
    await user.clear(input);
    await user.type(input, "7500");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload).toEqual({ monthly_saving_target: "7500" });
    expect(payload).not.toHaveProperty("budget_warning_threshold");
  });

  it("rejects a negative target without calling onSave", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <FinancialPreferencesSection savingTarget="5000" onSave={onSave} loading={false} />
    );

    const input = screen.getByLabelText(/monthly saving target/i);
    await user.clear(input);
    await user.type(input, "-100");
    fireEvent.submit(container.querySelector("form"));

    expect(await screen.findByText(/cannot be negative/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows a loading placeholder instead of the form while loading", () => {
    render(<FinancialPreferencesSection savingTarget="5000" onSave={vi.fn()} loading />);

    expect(screen.queryByLabelText(/monthly saving target/i)).not.toBeInTheDocument();
  });
});
