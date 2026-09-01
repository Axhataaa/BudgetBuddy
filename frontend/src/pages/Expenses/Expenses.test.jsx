import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../components/ui/Toast";
import Expenses from "./Expenses";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "../../services/expenseService";
import { getDashboardSummary } from "../../services/dashboardService";
import { listBudgets, getBudgetsSummary } from "../../services/budgetService";

vi.mock("../../services/expenseService", () => ({
  listExpenses: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}));
vi.mock("../../services/dashboardService", () => ({
  getDashboardSummary: vi.fn(),
}));
vi.mock("../../services/budgetService", () => ({
  listBudgets: vi.fn(),
  getBudgetsSummary: vi.fn(),
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
    vi.resetAllMocks();
    listExpenses.mockResolvedValue({ count: 0, results: [] });
    getDashboardSummary.mockResolvedValue({ current_balance: 100 });
    listBudgets.mockResolvedValue({ results: [] });
    getBudgetsSummary.mockResolvedValue([]);
    createExpense.mockResolvedValue({ id: 999 });
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

// Month/year of "today" — matches ExpenseForm's default date (getLocalDateString()),
// so the mocked budget entries line up with the submitted expense's date.
const today = new Date();
const CURRENT_MONTH = today.getMonth() + 1;
const CURRENT_YEAR = today.getFullYear();
const CURRENT_DAY = today.getDate();
const TODAY_DATE_STRING = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}-${String(CURRENT_DAY).padStart(2, "0")}`;

// findBudgetTier() (Expenses.jsx) fetches listBudgets({ category, month,
// year }) + getBudgetsSummary({ category, month, year }) together, both
// filtered to the exact same period. Since a real backend can only ever
// have zero or one budget for a given (category, month, year) — enforced
// by a unique constraint — a single-row result from each filtered call
// mocked here stands in for "the exact budget for this period".
function mockUnambiguousBudget({ category, month = CURRENT_MONTH, year = CURRENT_YEAR, alertLevel }) {
  listBudgets.mockResolvedValueOnce({
    count: 1,
    results: [{ id: 1, category, month, year }],
  });
  getBudgetsSummary.mockResolvedValueOnce([{ category, alert_level: alertLevel }]);
}

async function addExpense({ title, amount, category }) {
  const user = userEvent.setup();
  const addButtons = screen.getAllByRole("button", { name: "Add Expense" });
  await user.click(addButtons[0]);

  await user.type(screen.getByLabelText("Title"), title);
  await user.type(screen.getByLabelText("Amount"), amount);
  if (category) {
    await user.selectOptions(screen.getByLabelText("Category"), category);
  }
  await user.click(screen.getByRole("button", { name: "Save Expense" }));
}

async function editExpense(expense, { title, amount } = {}) {
  const user = userEvent.setup();
  await user.click(screen.getByLabelText("Edit"));

  if (title) {
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), title);
  }
  if (amount) {
    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), amount);
  }
  await user.click(screen.getByRole("button", { name: "Save Expense" }));
}

describe("Expenses page — budget threshold toasts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listExpenses.mockResolvedValue({ count: 0, results: [] });
    getDashboardSummary.mockResolvedValue({ current_balance: 100 });
    createExpense.mockResolvedValue({ id: 999 });
  });

  it("does not fetch budget data or show a threshold toast merely from loading the page", async () => {
    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    // No add/edit action has happened, so findBudgetTier should never have
    // been invoked — the page-load case has nothing to "snapshot before".
    expect(listBudgets).not.toHaveBeenCalled();
    expect(getBudgetsSummary).not.toHaveBeenCalled();
    expect(screen.queryByText(/budget/i)).not.toBeInTheDocument();
  });

  it("shows no budget warning for an ordinary expense that keeps the budget below 80%", async () => {
    // Before: 65% (no alert_level). After: 55%... i.e. never crosses 80%.
    mockUnambiguousBudget({ category: "Food", alertLevel: null });
    mockUnambiguousBudget({ category: "Food", alertLevel: null });

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    await addExpense({ title: "Groceries", amount: "500" });

    expect(await screen.findByText("Expense added.")).toBeInTheDocument();
    expect(screen.queryByText(/budget/i)).not.toBeInTheDocument();
  });

  it("shows the 80% warning toast when the expense causes the Food budget to cross 80%", async () => {
    mockUnambiguousBudget({ category: "Food", alertLevel: null });
    mockUnambiguousBudget({ category: "Food", alertLevel: "warning" });

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    await addExpense({ title: "Groceries", amount: "800" });

    expect(await screen.findByText("You've used 80% of your Food budget.")).toBeInTheDocument();
  });

  it("shows the 90% warning toast when the expense causes the Food budget to cross 90%", async () => {
    mockUnambiguousBudget({ category: "Food", alertLevel: "warning" });
    mockUnambiguousBudget({ category: "Food", alertLevel: "high_warning" });

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    await addExpense({ title: "Dinner out", amount: "900" });

    expect(
      await screen.findByText("You've used 90% of your Food budget. You're close to the limit.")
    ).toBeInTheDocument();
  });

  it("shows the exceeded-budget toast when the expense causes the Food budget to reach 100%", async () => {
    mockUnambiguousBudget({ category: "Food", alertLevel: "high_warning" });
    mockUnambiguousBudget({ category: "Food", alertLevel: "budget_exceeded" });

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    await addExpense({ title: "Big grocery run", amount: "1000" });

    expect(await screen.findByText("Your Food budget has been exceeded.")).toBeInTheDocument();
  });

  it("does not repeat the same threshold warning on a second save that stays at the same tier", async () => {
    // First save: before 0 (no alert) -> after "warning" (80) -> toast.
    mockUnambiguousBudget({ category: "Food", alertLevel: null });
    mockUnambiguousBudget({ category: "Food", alertLevel: "warning" });
    // Second save: before "warning" (80) -> after "warning" (80) -> no toast.
    mockUnambiguousBudget({ category: "Food", alertLevel: "warning" });
    mockUnambiguousBudget({ category: "Food", alertLevel: "warning" });

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    await addExpense({ title: "Groceries", amount: "800" });
    expect(await screen.findByText("You've used 80% of your Food budget.")).toBeInTheDocument();

    await addExpense({ title: "Snacks", amount: "50" });
    await waitFor(() => expect(getBudgetsSummary).toHaveBeenCalledTimes(4));

    expect(screen.getAllByText("You've used 80% of your Food budget.")).toHaveLength(1);
  });

  it("tracks different budget categories independently", async () => {
    mockUnambiguousBudget({ category: "Food", alertLevel: null });
    mockUnambiguousBudget({ category: "Food", alertLevel: "warning" });
    mockUnambiguousBudget({ category: "Travel", alertLevel: null });
    mockUnambiguousBudget({ category: "Travel", alertLevel: "high_warning" });

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    await addExpense({ title: "Groceries", amount: "800" });
    expect(await screen.findByText("You've used 80% of your Food budget.")).toBeInTheDocument();

    await addExpense({ title: "Flight", amount: "900", category: "Travel" });
    expect(
      await screen.findByText("You've used 90% of your Travel budget. You're close to the limit.")
    ).toBeInTheDocument();

    // The earlier Food warning is untouched by the independent Travel event.
    expect(screen.getByText("You've used 80% of your Food budget.")).toBeInTheDocument();
  });

  it("correctly attributes the threshold when the category has budgets in more than one month", async () => {
    // Two "Food" budgets on record — one for last month, one for the
    // current month. findBudgetTier is called with the current expense's
    // exact (category, month, year), so both the /budgets/ and
    // /budgets/summary/ calls are scoped to just the current month's
    // budget: the other month's budget/row is never even fetched, let
    // alone confused for this one.
    mockUnambiguousBudget({ category: "Food", alertLevel: null }); // before, current month
    mockUnambiguousBudget({ category: "Food", alertLevel: "warning" }); // after, current month

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    await addExpense({ title: "Groceries", amount: "800" });

    expect(await screen.findByText("You've used 80% of your Food budget.")).toBeInTheDocument();
    expect(listBudgets).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ category: "Food", month: CURRENT_MONTH, year: CURRENT_YEAR })
    );
    expect(getBudgetsSummary).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ category: "Food", month: CURRENT_MONTH, year: CURRENT_YEAR })
    );
  });

  it("skips the toast rather than guess when the budget/summary lookup is itself ambiguous", async () => {
    // Defensive case: even though (user, category, month, year) is unique
    // on the backend, findBudgetTier still refuses to guess if the
    // filtered responses ever come back with anything other than exactly
    // one matching row on each side. Because the "before" snapshot already
    // comes back null, checkBudgetThreshold short-circuits and never
    // fetches an "after" snapshot — so only one pair of calls happens here.
    listBudgets.mockResolvedValueOnce({
      count: 2,
      results: [{ id: 1, category: "Food", month: CURRENT_MONTH, year: CURRENT_YEAR }],
    });
    getBudgetsSummary.mockResolvedValueOnce([
      { category: "Food", alert_level: "warning" },
      { category: "Food", alert_level: "budget_exceeded" },
    ]);

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    await addExpense({ title: "Groceries", amount: "800" });

    expect(await screen.findByText("Expense added.")).toBeInTheDocument();
    expect(screen.queryByText(/budget/i)).not.toBeInTheDocument();
    expect(listBudgets).toHaveBeenCalledTimes(1);
  });

  it("shows a threshold toast on an edit that changes utilization enough to cross it", async () => {
    listExpenses.mockResolvedValue({
      count: 1,
      results: [
        {
          id: 5,
          title: "Groceries",
          category: "Food",
          payment_method: "UPI",
          date: TODAY_DATE_STRING,
          amount: "500",
        },
      ],
    });
    updateExpense.mockResolvedValue({ id: 5 });
    mockUnambiguousBudget({ category: "Food", alertLevel: "warning" }); // before: 82%
    mockUnambiguousBudget({ category: "Food", alertLevel: "high_warning" }); // after: 88%

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    await editExpense({}, { amount: "900" });

    expect(
      await screen.findByText("You've used 90% of your Food budget. You're close to the limit.")
    ).toBeInTheDocument();
  });

  it("shows no threshold toast on an edit that doesn't change the budget's tier", async () => {
    listExpenses.mockResolvedValue({
      count: 1,
      results: [
        {
          id: 5,
          title: "Groceries",
          category: "Food",
          payment_method: "UPI",
          date: TODAY_DATE_STRING,
          amount: "500",
        },
      ],
    });
    updateExpense.mockResolvedValue({ id: 5 });
    mockUnambiguousBudget({ category: "Food", alertLevel: "warning" }); // before: 82%
    mockUnambiguousBudget({ category: "Food", alertLevel: "warning" }); // after: still 82%, unrelated field changed

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    await editExpense({}, { title: "Weekly Groceries" });

    expect(await screen.findByText("Expense updated.")).toBeInTheDocument();
    expect(screen.queryByText(/budget/i)).not.toBeInTheDocument();
  });

  it("shows no threshold toast when deleting an expense, even if utilization drops across a threshold", async () => {
    listExpenses.mockResolvedValue({
      count: 1,
      results: [
        {
          id: 5,
          title: "Groceries",
          category: "Food",
          payment_method: "UPI",
          date: TODAY_DATE_STRING,
          amount: "500",
        },
      ],
    });
    deleteExpense.mockResolvedValue({});

    renderExpenses();
    await waitFor(() => expect(listExpenses).toHaveBeenCalled());

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Delete"));
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(await screen.findByText("Expense deleted.")).toBeInTheDocument();
    // Deletion never triggers a threshold check at all.
    expect(listBudgets).not.toHaveBeenCalled();
    expect(getBudgetsSummary).not.toHaveBeenCalled();
  });
});
