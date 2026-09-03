import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../components/ui/Toast";
import Budgets from "./Budgets";
import { listBudgets, updateBudget } from "../../services/budgetService";
import { getDashboardSummary } from "../../services/dashboardService";

vi.mock("../../services/budgetService", () => ({
  listBudgets: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
}));
vi.mock("../../services/dashboardService", () => ({
  getDashboardSummary: vi.fn(),
}));

function renderBudgets({ route = "/budgets", state } = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: route, state }]}>
      <ToastProvider>
        <Budgets />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe("Budgets page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listBudgets.mockResolvedValue({ results: [] });
    getDashboardSummary.mockResolvedValue({ budget_utilization: [] });
  });

  // Regression test: Dashboard "Budget Remaining" card hand-off.
  it("selects the Dashboard's chosen month/year (not the current month) when arriving via router state", async () => {
    renderBudgets({ state: { dashboardPeriod: { month: 7, year: 2026 } } });

    await waitFor(() => expect(listBudgets).toHaveBeenCalled());
    expect(listBudgets).toHaveBeenLastCalledWith(expect.objectContaining({ month: 7, year: 2026 }));
    expect(getDashboardSummary).toHaveBeenLastCalledWith(expect.objectContaining({ month: 7, year: 2026 }));

    // Reuses the existing month/year selector, whose header shows the label.
    expect(await screen.findByText(/July 2026/i)).toBeInTheDocument();
  });

  it("carries an August Dashboard selection through as August, not the browser's real current month", async () => {
    renderBudgets({ state: { dashboardPeriod: { month: 8, year: 2026 } } });

    await waitFor(() => expect(listBudgets).toHaveBeenCalled());
    expect(listBudgets).toHaveBeenLastCalledWith(expect.objectContaining({ month: 8, year: 2026 }));
  });

  // Regression test: direct navigation (e.g. sidebar) must be unaffected —
  // Budgets keeps defaulting to the real current month.
  it("defaults to the current month on direct navigation (no router state)", async () => {
    const now = new Date();
    renderBudgets();

    await waitFor(() => expect(listBudgets).toHaveBeenCalled());
    expect(listBudgets).toHaveBeenLastCalledWith(
      expect.objectContaining({ month: now.getMonth() + 1, year: now.getFullYear() })
    );
  });

  it("lets the user change the month/year after arriving from the Dashboard", async () => {
    renderBudgets({ state: { dashboardPeriod: { month: 7, year: 2026 } } });

    await waitFor(() => expect(listBudgets).toHaveBeenCalledTimes(1));

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /previous month/i }));

    await waitFor(() => {
      expect(listBudgets).toHaveBeenLastCalledWith(expect.objectContaining({ month: 6, year: 2026 }));
    });
  });

  // Backend follow-up: BudgetViewSet.update now returns tier_before/
  // tier_after/threshold_crossed_up whenever the edit itself caused a
  // genuine 80/90/100 tier crossing (budgets/notifications.py:
  // reconcile_budget_alerts_for_amount_change). The edit UI must surface
  // that as the same current-screen toast an expense threshold crossing
  // already gets - without any extra API round trip.
  describe("budget-edit threshold toast", () => {
    const editableBudget = {
      id: 1,
      category: "Food",
      monthly_limit: "8000.00",
      month: 8,
      year: 2026,
      percent_used: 45,
    };

    beforeEach(() => {
      listBudgets.mockResolvedValue({ results: [editableBudget] });
    });

    async function editMonthlyLimit(newLimit) {
      const user = userEvent.setup();
      await user.click(await screen.findByRole("button", { name: /edit/i }));

      const limitInput = await screen.findByLabelText(/monthly limit/i);
      await user.clear(limitInput);
      await user.type(limitInput, newLimit);

      await user.click(screen.getByRole("button", { name: /save budget/i }));
    }

    it("shows the 90% toast when a budget edit itself pushes usage into the 90% tier", async () => {
      updateBudget.mockResolvedValue({
        ...editableBudget,
        monthly_limit: "8500.00",
        tier_before: 0,
        tier_after: 90,
        threshold_crossed_up: true,
      });

      renderBudgets();
      await editMonthlyLimit("8500");

      expect(
        await screen.findByText("You've used 90% of your Food budget. You're close to the limit.")
      ).toBeInTheDocument();
    });

    it("shows the exceeded toast when a budget edit itself pushes usage to 100%+", async () => {
      updateBudget.mockResolvedValue({
        ...editableBudget,
        monthly_limit: "7000.00",
        tier_before: 0,
        tier_after: 100,
        threshold_crossed_up: true,
      });

      renderBudgets();
      await editMonthlyLimit("7000");

      expect(await screen.findByText("Your Food budget has been exceeded.")).toBeInTheDocument();
    });

    it("shows no threshold toast when a budget edit lowers the tier", async () => {
      updateBudget.mockResolvedValue({
        ...editableBudget,
        monthly_limit: "20000.00",
        tier_before: 90,
        tier_after: 0,
        threshold_crossed_up: false,
      });

      renderBudgets();
      await editMonthlyLimit("20000");

      expect(await screen.findByText("Budget updated.")).toBeInTheDocument();
      expect(screen.queryByText(/% of your Food budget/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/budget has been exceeded/i)).not.toBeInTheDocument();
    });

    it("shows no threshold toast when a budget edit stays within the same tier", async () => {
      updateBudget.mockResolvedValue({
        ...editableBudget,
        monthly_limit: "8600.00",
        tier_before: 80,
        tier_after: 80,
        threshold_crossed_up: false,
      });

      renderBudgets();
      await editMonthlyLimit("8600");

      expect(await screen.findByText("Budget updated.")).toBeInTheDocument();
      expect(screen.queryByText(/% of your Food budget/i)).not.toBeInTheDocument();
    });

    it("shows no threshold toast when the update response carries no transition (amount unchanged)", async () => {
      updateBudget.mockResolvedValue({ ...editableBudget });

      renderBudgets();
      await editMonthlyLimit("8000");

      expect(await screen.findByText("Budget updated.")).toBeInTheDocument();
      expect(screen.queryByText(/% of your Food budget/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/budget has been exceeded/i)).not.toBeInTheDocument();
    });
  });
});
