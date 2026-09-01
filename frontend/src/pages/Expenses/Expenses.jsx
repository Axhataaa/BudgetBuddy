import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LuPlus, LuPencil, LuTrash2, LuSearch, LuWallet, LuFilterX, LuArrowDownRight } from "react-icons/lu";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonRows from "../../components/ui/SkeletonRows";
import Pagination from "../../components/ui/Pagination";
import FilterChips from "../../components/ui/FilterChips";
import { useToast } from "../../components/ui/Toast";
import ExpenseForm from "./ExpenseForm";
import { formatCurrency } from "../../utils/formatCurrency";
import { TIME_PERIOD_OPTIONS, getDateRangeForPeriod, getMonthDateRange } from "../../utils/dateRanges";
import { AMOUNT_DATE_SORT_OPTIONS } from "../../utils/sortOptions";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getExpenseCategoryMeta } from "./expenseConstants";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../../services/expenseService";
import { getDashboardSummary } from "../../services/dashboardService";
import { listBudgets, getBudgetsSummary } from "../../services/budgetService";

const PAGE_SIZE = 20;

// Mirrors the 80/90/100 tiers already used by BudgetViewSet.summary's
// alert_level (backend/budgets/views.py) — not a new threshold model, just
// reading the same one on the frontend.
const ALERT_LEVEL_TIER = {
  budget_exceeded: 100,
  high_warning: 90,
  warning: 80,
};

function tierFromAlertLevel(alertLevel) {
  return ALERT_LEVEL_TIER[alertLevel] || 0;
}

// Finds the threshold tier (0/80/90/100) for one specific
// (category, month, year) budget, safely.
//
// Both requests are filtered by the exact same (category, month, year)
// triple, via BudgetFilter (backend/budgets/filters.py) — which
// BudgetViewSet.summary now also applies (backend/budgets/views.py),
// instead of building its response from the unfiltered queryset. That's
// the minimal backend change this fix required: /budgets/summary/
// previously ignored query params entirely, so a category with budgets in
// more than one month (e.g. "Food" in both July and August) returned
// several rows all sharing category: "Food" with nothing to tell them
// apart, and no filter existed to narrow it. That limitation lived in the
// backend, not the frontend, so it couldn't be fixed safely from here
// alone.
//
// Because (user, category, month, year) is enforced unique on Budget
// (backend/budgets/models.py, unique_budget_per_category_per_month),
// filtering by all three can only ever match zero or one budget — so a
// single-item result from each filtered call *is* the exact budget, not a
// guess. This never pairs two independently-fetched, unrelated arrays
// positionally: both calls carry the same filter criteria, so a
// single-row result from each is guaranteed (by the DB constraint) to
// refer to the same budget. `count` (from /budgets/, not
// `results.length`) is still used to confirm there's truly one match
// regardless of pagination, exactly as before.
async function findBudgetTier(category, month, year) {
  if (!category || !month || !year) return null;

  try {
    const [budgetsResponse, summary] = await Promise.all([
      listBudgets({ category, month, year }),
      getBudgetsSummary({ category, month, year }),
    ]);

    const results = budgetsResponse.results || [];
    const totalForFilter = budgetsResponse.count ?? results.length;
    if (totalForFilter !== 1 || results.length !== 1) return null;

    const [budget] = results;
    if (budget.category !== category || budget.month !== month || budget.year !== year) {
      return null;
    }

    if (!Array.isArray(summary) || summary.length !== 1) return null;
    const [summaryRow] = summary;
    if (summaryRow.category !== category) return null;

    return tierFromAlertLevel(summaryRow.alert_level);
  } catch {
    return null;
  }
}

function monthYearFromDateString(dateString) {
  if (!dateString) return { month: null, year: null };
  const [year, month] = dateString.split("-").map(Number);
  return { month, year };
}

const emptyFilters = {
  search: "",
  category: "",
  paymentMethod: "",
  timePeriod: "",
  customFrom: "",
  customTo: "",
};

// When arriving from a Dashboard stat card (see StatCards.jsx), the
// Dashboard's selected month/year is handed off via router state so this
// page can open already scoped to that period, using the existing "Custom
// Date Range" filter rather than a new filtering mechanism. Direct
// navigation (e.g. from the sidebar) has no router state, so it falls back
// to the normal unfiltered default.
function getInitialFilters(dashboardPeriod) {
  if (!dashboardPeriod?.month || !dashboardPeriod?.year) return emptyFilters;
  const { date_from, date_to } = getMonthDateRange(dashboardPeriod.month, dashboardPeriod.year);
  return { ...emptyFilters, timePeriod: "custom", customFrom: date_from, customTo: date_to };
}

export default function Expenses() {
  const { showToast } = useToast();
  const location = useLocation();

  const [expenses, setExpenses] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(() => getInitialFilters(location.state?.dashboardPeriod));
  const { search, category, paymentMethod, timePeriod, customFrom, customTo } = filters;
  const [ordering, setOrdering] = useState("-date");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const setFilter = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE, ordering };
      if (search) params.search = search;
      if (category) params.category = category;
      if (paymentMethod) params.payment_method = paymentMethod;

      if (timePeriod === "custom") {
        if (customFrom) params.date_from = customFrom;
        if (customTo) params.date_to = customTo;
      } else if (timePeriod) {
        const range = getDateRangeForPeriod(timePeriod);
        if (range) {
          params.date_from = range.date_from;
          params.date_to = range.date_to;
        }
      }

      const data = await listExpenses(params);
      setExpenses(data.results);
      setCount(data.count);
    } catch {
      showToast("Couldn't load expenses. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchExpenses, 300);
    return () => clearTimeout(timer);

  }, [search, category, paymentMethod, timePeriod, customFrom, customTo, ordering, page]);

  useEffect(() => {
    setPage(1);
  }, [search, category, paymentMethod, timePeriod, customFrom, customTo, ordering]);

  const openAddModal = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleSubmit = async (formValues) => {
    setSubmitting(true);
    try {
      // Snapshot this budget's tier *before* the save mutates anything, so
      // the toast afterward reflects a crossing caused by this action —
      // not merely the budget's standing state (also what keeps a fresh
      // page load from toasting about a budget that's already at 80%+).
      const { month, year } = monthYearFromDateString(formValues.date);
      const tierBefore = await findBudgetTier(formValues.category, month, year);

      if (editingExpense) {
        await updateExpense(editingExpense.id, formValues);
        showToast("Expense updated.", "success");
      } else {
        await createExpense(formValues);
        showToast("Expense added.", "success");
      }
      setModalOpen(false);
      fetchExpenses();
      checkResultingBalance(formValues.date);
      checkBudgetThreshold(formValues.category, month, year, tierBefore);
    } catch (err) {
      const message = err.response?.data?.error?.message || "Couldn't save expense.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Immediate, current-screen-only feedback when this expense causes its
  // category's budget to reach/cross the 80/90/100 thresholds already
  // computed by BudgetViewSet.summary. Only toasts when the tier actually
  // increased versus the pre-save snapshot (`tierBefore`), so it never
  // fires on page load, on an edit that doesn't change utilization, or
  // after a delete (nothing calls this from handleDelete). `findBudgetTier`
  // itself refuses to answer when the category/period can't be safely
  // identified, so an unresolved `tierBefore` (null) skips the check
  // rather than guessing.
  const checkBudgetThreshold = async (categoryValue, month, year, tierBefore) => {
    if (tierBefore === null) return;

    const tierAfter = await findBudgetTier(categoryValue, month, year);
    if (tierAfter === null || tierAfter <= tierBefore) return;

    if (tierAfter >= 100) {
      showToast(`Your ${categoryValue} budget has been exceeded.`, "error");
    } else if (tierAfter >= 90) {
      showToast(`You've used 90% of your ${categoryValue} budget. You're close to the limit.`, "warning");
    } else if (tierAfter >= 80) {
      showToast(`You've used 80% of your ${categoryValue} budget.`, "warning");
    }
  };

  const checkResultingBalance = async (dateString) => {
    if (!dateString) return;
    const [year, month] = dateString.split("-").map(Number);
    try {
      const summary = await getDashboardSummary({ month, year });
      if (Number(summary.current_balance) < 0) {
        showToast(
          "Heads up! This transaction results in a negative current balance.",
          "warning"
        );
      }
    } catch {

    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
      showToast("Expense deleted.", "success");
      setDeleteTarget(null);
      fetchExpenses();
    } catch {
      showToast("Couldn't delete expense.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const isTimePeriodActive = timePeriod && (timePeriod !== "custom" || customFrom || customTo);
  const hasFilters = search || category || paymentMethod || isTimePeriodActive;

  const timePeriodLabel = TIME_PERIOD_OPTIONS.find((o) => o.value === timePeriod)?.label;

  const chips = [
    search && { key: "search", label: `Search: "${search}"`, onRemove: () => setFilter("search")("") },
    category && { key: "category", label: `Category: ${category}`, onRemove: () => setFilter("category")("") },
    paymentMethod && {
      key: "payment",
      label: `Payment: ${paymentMethod}`,
      onRemove: () => setFilter("paymentMethod")(""),
    },
    timePeriod &&
      timePeriod !== "custom" && {
        key: "period",
        label: timePeriodLabel,
        onRemove: () => setFilter("timePeriod")(""),
      },
    timePeriod === "custom" &&
      (customFrom || customTo) && {
        key: "custom",
        label: `${customFrom || "…"} → ${customTo || "…"}`,
        onRemove: () => setFilters((prev) => ({ ...prev, timePeriod: "", customFrom: "", customTo: "" })),
      },
  ].filter(Boolean);

  return (
    <div>
      <div className="bg-surface rounded shadow-token-sm p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <span className="page-header-icon icon-expense">
            <LuArrowDownRight size={22} />
          </span>
          <div>
            <h1 className="font-display fs-3 fw-semibold mb-1">Expenses</h1>
            <p className="text-muted-ink mb-0">Track and manage all your expenses.</p>
          </div>
        </div>

        <Button icon={LuPlus} onClick={openAddModal}>
          Add Expense
        </Button>
      </div>

      <div className="bg-surface rounded shadow-token-sm p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-4">
            <div className="position-relative">
              <LuSearch
                size={16}
                className="position-absolute text-muted-ink"
                style={{ top: 12, left: 12 }}
              />
              <input
                className="form-control ps-5"
                placeholder="Search by title or description..."
                value={search}
                onChange={(e) => setFilter("search")(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={category} onChange={(e) => setFilter("category")(e.target.value)}>
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setFilter("paymentMethod")(e.target.value)}
            >
              <option value="">All payment methods</option>
              {PAYMENT_METHODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={timePeriod}
              onChange={(e) => setFilter("timePeriod")(e.target.value)}
            >
              {TIME_PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
              {AMOUNT_DATE_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {timePeriod === "custom" && (
          <div className="row g-2 mt-1">
            <div className="col-6 col-md-2">
              <input
                type="date"
                className="form-control"
                value={customFrom}
                onChange={(e) => setFilter("customFrom")(e.target.value)}
                aria-label="From date"
              />
            </div>
            <div className="col-6 col-md-2">
              <input
                type="date"
                className="form-control"
                value={customTo}
                onChange={(e) => setFilter("customTo")(e.target.value)}
                aria-label="To date"
              />
            </div>
          </div>
        )}
      </div>

      <div className="d-flex align-items-center justify-content-between">
        <FilterChips chips={chips} />
        {hasFilters && (
          <Button variant="ghost" icon={LuFilterX} onClick={() => setFilters(emptyFilters)} className="mb-3">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="bg-surface rounded shadow-token-sm">
        <div className="table-responsive" style={{ maxHeight: 640, overflowY: "auto" }}>
          <table className="table mb-0 align-middle transaction-table">
            <thead className="sticky-top bg-surface">
              <tr className="text-muted-ink small text-uppercase">
                <th className="py-3">Title</th>
                <th className="py-3">Category</th>
                <th className="py-3">Payment</th>
                <th className="py-3">Date</th>
                <th className="py-3 text-end">Amount</th>
                <th className="py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={6} columns={6} />
              ) : (
                expenses.map((expense) => {
                  const meta = getExpenseCategoryMeta(expense.category);
                  const CategoryIcon = meta.icon;
                  return (
                    <tr key={expense.id}>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-3">
                          <span className={`category-icon ${meta.badge}`}>
                            <CategoryIcon size={16} />
                          </span>
                          <div className="min-w-0">
                            <div className="fw-medium text-ink">{expense.title}</div>
                            {expense.description && (
                              <div className="small text-muted-ink">{expense.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`badge rounded-pill ${meta.badge}`}>{expense.category}</span>
                      </td>
                      <td className="py-3 text-muted-ink">{expense.payment_method}</td>
                      <td className="py-3 text-muted-ink">{expense.date}</td>
                      <td className="py-3 text-end font-currency text-expense fw-medium">
                        -{formatCurrency(expense.amount)}
                      </td>
                      <td className="py-3 text-end">
                        <button
                          className="btn btn-sm btn-link text-muted-ink row-action-btn"
                          onClick={() => openEditModal(expense)}
                          aria-label="Edit"
                        >
                          <LuPencil size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-link text-danger row-action-btn"
                          onClick={() => setDeleteTarget(expense)}
                          aria-label="Delete"
                        >
                          <LuTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && expenses.length === 0 && (
          <EmptyState
            icon={LuWallet}
            message={
              hasFilters
                ? "No expenses match your search or filters."
                : "No expenses yet — add your first one to get started."
            }
            action={
              hasFilters ? (
                <Button variant="ghost" icon={LuFilterX} onClick={() => setFilters(emptyFilters)}>
                  Clear Filters
                </Button>
              ) : (
                <Button icon={LuPlus} onClick={openAddModal}>
                  Add Expense
                </Button>
              )
            }
          />
        )}

        {!loading && expenses.length > 0 && (
          <Pagination count={count} pageSize={PAGE_SIZE} page={page} onPageChange={setPage} />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
      >
        <ExpenseForm
          initialValues={editingExpense}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this expense?"
        message={
          deleteTarget
            ? `"${deleteTarget.title}" (${deleteTarget.date}, ${formatCurrency(deleteTarget.amount)}) will be permanently deleted. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
