import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider } from "../../components/ui/Toast";
import AddSavingsModal from "./AddSavingsModal";
import { createSavingsTransaction } from "../../services/savingsTransactionService";

vi.mock("../../services/savingsTransactionService", () => ({
  createSavingsTransaction: vi.fn(),
}));

const goal = {
  id: 1,
  goal_name: "Emergency Fund",
  target_amount: "50000",
  current_amount: "45000",
};

function renderModal(overrides = {}) {
  const onHide = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <ToastProvider>
      <AddSavingsModal
        show={true}
        goal={goal}
        onHide={onHide}
        onSuccess={onSuccess}
        {...overrides}
      />
    </ToastProvider>
  );
  return { onHide, onSuccess, ...utils };
}

// The Amount field is the modal's only numeric input (Note is a textarea),
// and AddSavingsModal doesn't pass an id/name to Input (a pre-existing gap
// unrelated to this fix), so `label` isn't programmatically associated with
// the field. Query by its "spinbutton" role instead of getByLabelText.
function getAmountField() {
  return screen.getByRole("spinbutton");
}

describe("AddSavingsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the remaining amount needed to reach the goal", () => {
    renderModal();
    expect(screen.getByText(/remaining to goal/i)).toBeInTheDocument();
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });

  it("accepts a deposit below the remaining amount", async () => {
    createSavingsTransaction.mockResolvedValueOnce({});
    const user = userEvent.setup();
    const { onSuccess } = renderModal();

    await user.type(getAmountField(), "1000");
    await user.click(screen.getByRole("button", { name: /add savings/i }));

    expect(createSavingsTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ goal: 1, transaction_amount: 1000, transaction_type: "deposit" })
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("accepts a deposit exactly equal to the remaining amount", async () => {
    createSavingsTransaction.mockResolvedValueOnce({});
    const user = userEvent.setup();
    const { onSuccess } = renderModal();

    await user.type(getAmountField(), "5000");
    await user.click(screen.getByRole("button", { name: /add savings/i }));

    expect(createSavingsTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ transaction_amount: 5000 })
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  // These two amounts also violate the input's native `max` attribute, which
  // jsdom (like a real browser) uses to block the click-triggered submit
  // event before our own handler runs. Submitting the form directly exercises
  // our JS validation the same way Enter-to-submit (or a browser without the
  // constraint) would — matching the pattern already used in IncomeForm.test.jsx.
  it("rejects a deposit above the remaining amount without calling the API", async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderModal();

    await user.type(getAmountField(), "5001");
    fireEvent.submit(document.querySelector("form"));

    expect(await screen.findByText(/cannot exceed the remaining/i)).toBeInTheDocument();
    expect(createSavingsTransaction).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("rejects a deposit substantially above the remaining amount without calling the API", async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderModal();

    await user.type(getAmountField(), "10000");
    fireEvent.submit(document.querySelector("form"));

    expect(await screen.findByText(/cannot exceed the remaining/i)).toBeInTheDocument();
    expect(createSavingsTransaction).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("rejects a zero or negative amount", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(getAmountField(), "0");
    await user.click(screen.getByRole("button", { name: /add savings/i }));

    expect(await screen.findByText(/enter a valid amount/i)).toBeInTheDocument();
    expect(createSavingsTransaction).not.toHaveBeenCalled();
  });
});
