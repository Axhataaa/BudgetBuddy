import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../components/ui/Toast";
import Expenses from "./Expenses";
import { listExpenses } from "../../services/expenseService";
import { getDashboardSummary } from "../../services/dashboardService";

vi.mock("../../services/expenseService", () => ({
  listExpenses: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}));
vi.mock("../../services/dashboardService", () => ({
  getDashboardSummary: vi.fn(),
}));

function renderExpenses({ route = "/expenses", state } = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: route, state }]}>
      <ToastProvider>
        <Expenses />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe("Expenses page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listExpenses.mockResolvedValue({ count: 0, results: [] });
    getDashboardSummary.mockResolvedValue({ current_balance: 100 });
  });

  // Regression test: Dashboard "Total Expenses" card hand-off.
  it("applies the Dashboard's selected period (not the current month) as a custom date filter when arriving via router state", async () => {
    renderExpenses({ state: { dashboardPeriod: { month: 7, year: 2026 } } });

    await waitFor(() => expect(listExpenses).toHaveBeenCalled());
    expect(listExpenses).toHaveBeenLastCalledWith(
      expect.objectContaining({ date_from: "2026-07-01", date_to: "2026-07-31" })
    );

    // The existing "Custom Date Range" filter UI reflects the applied dates
    // — no separate/new filtering system was introduced.
    expect(await screen.findByDisplayValue("2026-07-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-07-31")).toBeInTheDocument();
  });

  it("carries an August Dashboard selection through as August, not the browser's real current month", async () => {
    renderExpenses({ state: { dashboardPeriod: { month: 8, year: 2026 } } });

    await waitFor(() => expect(listExpenses).toHaveBeenCalled());
    expect(listExpenses).toHaveBeenLastCalledWith(
      expect.objectContaining({ date_from: "2026-08-01", date_to: "2026-08-31" })
    );
  });

  // Regression test: direct navigation (e.g. sidebar) must be unaffected.
  it("opens with no date filter applied on direct navigation (no router state)", async () => {
    renderExpenses();

    await waitFor(() => expect(listExpenses).toHaveBeenCalled());
    const params = listExpenses.mock.calls[0][0];
    expect(params.date_from).toBeUndefined();
    expect(params.date_to).toBeUndefined();
  });

  // The Dashboard period only seeds the initial filter — it must remain a
  // normal, user-editable filter afterward.
  it("lets the user change the filter after arriving from the Dashboard", async () => {
    renderExpenses({ state: { dashboardPeriod: { month: 7, year: 2026 } } });

    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    const select = screen.getByDisplayValue("Custom Date Range");
    const user = userEvent.setup();
    await user.selectOptions(select, "this_year");

    await waitFor(() => {
      const lastCall = listExpenses.mock.calls.at(-1)[0];
      expect(lastCall.date_from).not.toBe("2026-07-01");
    });
  });
});
