import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../components/ui/Toast";
import Budgets from "./Budgets";
import { listBudgets } from "../../services/budgetService";
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
});
