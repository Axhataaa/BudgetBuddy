import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../components/ui/Toast";
import Income from "./Income";
import { listIncomes } from "../../services/incomeService";

vi.mock("../../services/incomeService", () => ({
  listIncomes: vi.fn(),
  createIncome: vi.fn(),
  updateIncome: vi.fn(),
  deleteIncome: vi.fn(),
}));

function renderIncome({ route = "/income", state } = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: route, state }]}>
      <ToastProvider>
        <Income />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe("Income page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listIncomes.mockResolvedValue({ count: 0, results: [] });
  });

  // Regression test: Dashboard "Total Income" card hand-off.
  it("applies the Dashboard's selected period (not the current month) as a custom date filter when arriving via router state", async () => {
    renderIncome({ state: { dashboardPeriod: { month: 7, year: 2026 } } });

    await waitFor(() => expect(listIncomes).toHaveBeenCalled());
    expect(listIncomes).toHaveBeenLastCalledWith(
      expect.objectContaining({ date_from: "2026-07-01", date_to: "2026-07-31" })
    );

    expect(await screen.findByDisplayValue("2026-07-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-07-31")).toBeInTheDocument();
  });

  it("carries an August Dashboard selection through as August, not the browser's real current month", async () => {
    renderIncome({ state: { dashboardPeriod: { month: 8, year: 2026 } } });

    await waitFor(() => expect(listIncomes).toHaveBeenCalled());
    expect(listIncomes).toHaveBeenLastCalledWith(
      expect.objectContaining({ date_from: "2026-08-01", date_to: "2026-08-31" })
    );
  });

  // Regression test: direct navigation (e.g. sidebar) must be unaffected.
  it("opens with no date filter applied on direct navigation (no router state)", async () => {
    renderIncome();

    await waitFor(() => expect(listIncomes).toHaveBeenCalled());
    const params = listIncomes.mock.calls[0][0];
    expect(params.date_from).toBeUndefined();
    expect(params.date_to).toBeUndefined();
  });

  it("lets the user change the filter after arriving from the Dashboard", async () => {
    renderIncome({ state: { dashboardPeriod: { month: 7, year: 2026 } } });

    await waitFor(() => expect(listIncomes).toHaveBeenCalled());

    const select = screen.getByDisplayValue("Custom Date Range");
    const user = userEvent.setup();
    await user.selectOptions(select, "this_year");

    await waitFor(() => {
      const lastCall = listIncomes.mock.calls.at(-1)[0];
      expect(lastCall.date_from).not.toBe("2026-07-01");
    });
  });
});
