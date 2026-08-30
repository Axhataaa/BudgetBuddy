import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/test-utils";
import SavingsGoals from "./SavingsGoals";
import {
  listSavingsGoals,
  getSavingsGoalsSummary,
  deleteSavingsGoal,
} from "../../services/savingsGoalService";

vi.mock("../../services/savingsGoalService", () => ({
  listSavingsGoals: vi.fn(),
  getSavingsGoalsSummary: vi.fn(),
  deleteSavingsGoal: vi.fn(),
  completePurchase: vi.fn(),
  completeGoal: vi.fn(),
}));

// The goal-mutating modals (GoalFormModal, AddSavingsModal,
// WithdrawSavingsModal, PurchaseCompletedModal) each have their own
// dedicated test files covering their internals. Here we only need to
// confirm that SavingsGoals wires their onSuccess callback to refresh
// the summary, so they're mocked down to a stub that exposes that
// callback via a test id.
vi.mock("./GoalFormModal", () => ({
  default: ({ show, onSuccess }) =>
    show ? (
      <button data-testid="goal-form-success" onClick={onSuccess}>
        stub-goal-form-success
      </button>
    ) : null,
}));

vi.mock("./AddSavingsModal", () => ({
  default: ({ show, onSuccess }) =>
    show ? (
      <button data-testid="add-savings-success" onClick={onSuccess}>
        stub-add-savings-success
      </button>
    ) : null,
}));

vi.mock("./WithdrawSavingsModal", () => ({
  default: ({ show, onSuccess }) =>
    show ? (
      <button data-testid="withdraw-success" onClick={onSuccess}>
        stub-withdraw-success
      </button>
    ) : null,
}));

vi.mock("./PurchaseCompletedModal", () => ({
  default: ({ show, onSuccess }) =>
    show ? (
      <button data-testid="purchase-success" onClick={onSuccess}>
        stub-purchase-success
      </button>
    ) : null,
}));

const laptop = {
  id: 1,
  goal_name: "New Laptop",
  description: "Work machine",
  goal_type: "PURCHASE",
  goal_category: "ELECTRONICS",
  target_amount: "80000",
  current_amount: "20000",
  target_date: "2099-01-01",
  progress_percentage: "25",
  is_completed: false,
};

const trip = {
  id: 2,
  goal_name: "Japan Trip",
  description: "Cherry blossom season",
  goal_type: "TRAVEL",
  goal_category: "OTHER",
  target_amount: "150000",
  current_amount: "150000",
  target_date: "2099-02-01",
  progress_percentage: "100",
  is_completed: true,
};

const fullSummary = {
  active_goals: 5,
  completed_goals: 3,
  saved_amount: 220000,
  target_amount: 530000,
};

function mockListResponse(goals) {
  return { results: goals, count: goals.length };
}

describe("SavingsGoals summary cards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSavingsGoalsSummary.mockResolvedValue(fullSummary);
    listSavingsGoals.mockResolvedValue(mockListResponse([laptop, trip]));
  });

  it("loads the summary from the dedicated summary endpoint on mount", async () => {
    renderWithProviders(<SavingsGoals />);

    await waitFor(() => {
      expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
    });

    // Summary values come from the summary endpoint response, not from
    // deriving totals out of the (possibly filtered/paginated) goals list.
    expect(await screen.findByText("5")).toBeInTheDocument();
    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("does not refetch the summary when the status filter changes", async () => {
    renderWithProviders(<SavingsGoals />);

    await waitFor(() => {
      expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
    });

    listSavingsGoals.mockResolvedValueOnce(mockListResponse([trip]));

    const statusSelect = await screen.findByDisplayValue("All goals");
    statusSelect.value = "completed";
    statusSelect.dispatchEvent(new Event("change", { bubbles: true }));

    await waitFor(() => {
      expect(listSavingsGoals).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" })
      );
    });

    // The filter change triggered a new grid fetch, but the summary
    // fetch count must remain exactly what it was on mount.
    expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
  });

  it("does not refetch the summary when search changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SavingsGoals />);

    await waitFor(() => {
      expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
    });

    const searchInput = await screen.findByPlaceholderText(
      /search by goal name or description/i
    );
    await user.type(searchInput, "Laptop");

    await waitFor(() => {
      expect(listSavingsGoals).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Laptop" })
      );
    });

    expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
  });

  it("still renders the filtered grid correctly alongside an unaffected summary", async () => {
    listSavingsGoals.mockResolvedValue(mockListResponse([trip]));

    renderWithProviders(<SavingsGoals />);

    // Grid shows only what the (mocked, already-filtered) list response
    // contains...
    expect(await screen.findByText("Japan Trip")).toBeInTheDocument();
    expect(screen.queryByText("New Laptop")).not.toBeInTheDocument();

    // ...while the summary cards still show the full-dataset totals from
    // the summary endpoint, not derived from the filtered grid.
    expect(await screen.findByText("5")).toBeInTheDocument();
    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("does not refetch the summary when changing page", async () => {
    // 25 results with PAGE_SIZE=20 forces the Pagination control to render.
    listSavingsGoals.mockResolvedValue({
      results: [laptop, trip],
      count: 25,
    });

    renderWithProviders(<SavingsGoals />);

    await waitFor(() => {
      expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
    });

    const activeGoalsBefore = await screen.findByText("5");
    const completedGoalsBefore = await screen.findByText("3");
    expect(activeGoalsBefore).toBeInTheDocument();
    expect(completedGoalsBefore).toBeInTheDocument();

    const nextButton = await screen.findByRole("button", { name: /next/i });
    nextButton.click();

    await waitFor(() => {
      expect(listSavingsGoals).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });

    // Pagination triggered a new grid fetch, but the summary fetch count
    // and the displayed summary values must remain exactly what they
    // were before the page change.
    expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not refetch the summary when changing sorting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SavingsGoals />);

    await waitFor(() => {
      expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
    });

    const sortSelect = await screen.findByDisplayValue(
      /target date — soonest/i
    );
    await user.selectOptions(sortSelect, "-target_amount");

    await waitFor(() => {
      expect(listSavingsGoals).toHaveBeenCalledWith(
        expect.objectContaining({ ordering: "-target_amount" })
      );
    });

    expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
  });

  it("does not refetch the summary when changing the goal type filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SavingsGoals />);

    await waitFor(() => {
      expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
    });

    const typeSelect = await screen.findByDisplayValue(/all types/i);
    await user.selectOptions(typeSelect, "FUND");

    await waitFor(() => {
      expect(listSavingsGoals).toHaveBeenCalledWith(
        expect.objectContaining({ goal_type: "FUND" })
      );
    });

    expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
  });

  it("does not refetch the summary when changing the goal category filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SavingsGoals />);

    await waitFor(() => {
      expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
    });

    const categorySelect = await screen.findByDisplayValue(/all categories/i);
    await user.selectOptions(categorySelect, "EMERGENCY_SAFETY");

    await waitFor(() => {
      expect(listSavingsGoals).toHaveBeenCalledWith(
        expect.objectContaining({ goal_category: "EMERGENCY_SAFETY" })
      );
    });

    expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1);
  });

  it("refreshes the summary after creating/editing a goal", async () => {
    renderWithProviders(<SavingsGoals />);
    await waitFor(() => expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1));

    await screen.findByText("New Laptop");
    const addGoalButton = screen.getByRole("button", { name: /add goal/i });
    addGoalButton.click();

    const successButton = await screen.findByTestId("goal-form-success");
    successButton.click();

    await waitFor(() => {
      expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(2);
    });
  });

  it("refreshes the summary after adding savings", async () => {
    renderWithProviders(<SavingsGoals />);
    await waitFor(() => expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1));

    await screen.findByText("New Laptop");
    const addSavingsButtons = screen.getAllByRole("button", {
      name: /add savings/i,
    });
    addSavingsButtons[0].click();

    const successButton = await screen.findByTestId("add-savings-success");
    successButton.click();

    await waitFor(() => {
      expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(2);
    });
  });

  it("refreshes the summary after deleting a goal", async () => {
    deleteSavingsGoal.mockResolvedValueOnce({});
    renderWithProviders(<SavingsGoals />);
    await waitFor(() => expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(1));

    await screen.findByText("New Laptop");
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    deleteButtons[0].click();

    await screen.findByText(/delete this goal\?/i);
    const deleteLabelButtons = await screen.findAllByRole("button", {
      name: /^delete$/i,
    });
    // Both GoalCard's own "Delete" buttons and the confirm dialog's
    // "Delete" button match this name; the confirm dialog is rendered
    // via a portal appended after them, so it's the last match.
    const confirmButton = deleteLabelButtons[deleteLabelButtons.length - 1];
    confirmButton.click();

    await waitFor(() => {
      expect(deleteSavingsGoal).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(getSavingsGoalsSummary).toHaveBeenCalledTimes(2);
    });
  });
});
