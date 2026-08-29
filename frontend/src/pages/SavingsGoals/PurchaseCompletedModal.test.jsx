import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "../../components/ui/Toast";
import PurchaseCompletedModal from "./PurchaseCompletedModal";
import { completePurchase, completeGoal } from "../../services/savingsGoalService";

vi.mock("../../services/savingsGoalService", () => ({
  completePurchase: vi.fn(),
  completeGoal: vi.fn(),
}));

function renderModal(goal, overrides = {}) {
  const onHide = vi.fn();
  const onSuccess = vi.fn();
  const utils = render(
    <ToastProvider>
      <PurchaseCompletedModal
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

describe("PurchaseCompletedModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows purchase wording and calls complete-purchase for a PURCHASE goal", async () => {
    const goal = { id: 1, goal_name: "Sports Shoes", goal_type: "PURCHASE" };
    completePurchase.mockResolvedValueOnce({});
    const user = userEvent.setup();
    const { onSuccess } = renderModal(goal);

    expect(screen.getByText("Purchase Completed")).toBeInTheDocument();
    expect(screen.getByText("Purchase Date")).toBeInTheDocument();
    expect(screen.getByText("Purchase Note")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /complete purchase/i }));

    expect(completePurchase).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ purchase_date: expect.any(String), purchase_note: "" })
    );
    expect(completeGoal).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows generic completion wording and calls complete-goal for a non-purchase goal", async () => {
    const goal = { id: 2, goal_name: "Emergency Fund", goal_type: "FUND" };
    completeGoal.mockResolvedValueOnce({});
    const user = userEvent.setup();
    const { onSuccess } = renderModal(goal);

    expect(screen.getByText("Savings Goal Completed")).toBeInTheDocument();
    expect(screen.getByText("Completion Date")).toBeInTheDocument();
    expect(screen.getByText("Completion Note")).toBeInTheDocument();
    expect(screen.queryByText("Purchase Date")).not.toBeInTheDocument();
    expect(screen.queryByText("Purchase Note")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /complete savings goal/i }));

    expect(completeGoal).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ completion_date: expect.any(String), completion_note: "" })
    );
    expect(completePurchase).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("treats a goal with a missing goal_type as PURCHASE (backward compatibility)", async () => {
    const goal = { id: 3, goal_name: "Legacy Goal" };
    completePurchase.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderModal(goal);

    expect(screen.getByText("Purchase Completed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /complete purchase/i }));

    expect(completePurchase).toHaveBeenCalledWith(3, expect.any(Object));
    expect(completeGoal).not.toHaveBeenCalled();
  });

  it("shows the API error and does not call onSuccess when complete-goal fails", async () => {
    const goal = { id: 4, goal_name: "Goa Trip", goal_type: "TRAVEL" };
    completeGoal.mockRejectedValueOnce({
      response: { data: { error: "Goal has not reached its target yet." } },
    });
    const user = userEvent.setup();
    const { onSuccess } = renderModal(goal);

    await user.click(screen.getByRole("button", { name: /complete savings goal/i }));

    expect(await screen.findByText("Goal has not reached its target yet.")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
