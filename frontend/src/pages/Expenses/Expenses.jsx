import { useEffect, useState } from "react";
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
import { TIME_PERIOD_OPTIONS, getDateRangeForPeriod } from "../../utils/dateRanges";
import { AMOUNT_DATE_SORT_OPTIONS } from "../../utils/sortOptions";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getExpenseCategoryMeta } from "./expenseConstants";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../../services/expenseService";
import { getDashboardSummary } from "../../services/dashboardService";

const PAGE_SIZE = 20;

const emptyFilters = {
  search: "",
  category: "",
  paymentMethod: "",
  timePeriod: "",
  customFrom: "",
  customTo: "",
};

export default function Expenses() {
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(emptyFilters);
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

      // "custom" uses the two explicit date inputs; every other preset
      // is computed from getDateRangeForPeriod - either way, both flow
      // into the same existing date_from/date_to backend params.
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

  // Search is debounced (300ms) so we don't fire a request on every
  // keystroke - every other filter applies through the same debounced
  // effect (existing pattern, unchanged), just with more dependencies now.
  useEffect(() => {
    const timer = setTimeout(fetchExpenses, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, paymentMethod, timePeriod, customFrom, customTo, ordering, page]);

  // Any filter change resets to page 1 - staying on page 3 of a filtered
  // result set that now has 1 page would silently show nothing.
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
    } catch (err) {
      // Backend validation errors arrive in the approved envelope shape
      // (API Design Doc §7) - surfacing the message here; per-field
      // inline errors are handled by ExpenseForm's own client-side
      // validation for the common cases (amount, date, title).
      const message = err.response?.data?.error?.message || "Couldn't save expense.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Task 13: BudgetBuddy is a tracker, not a wallet - expenses are
  // never blocked for exceeding the balance (handleSubmit above always
  // saves first). This only informs the user afterward if the balance
  // for that expense's month has gone negative, reusing the same
  // dashboard summary endpoint the Dashboard page already calls rather
  // than duplicating the balance calculation on the frontend. Errors
  // here are swallowed deliberately - the expense itself already saved
  // successfully, so a failed balance check shouldn't surface as if
  // something went wrong with the save.
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
      // Non-critical - silently skip the warning rather than
      // implying the expense save itself failed.
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
      {/* Header - same bg-surface card + tinted icon container
          structure as the redesigned Notifications page, just its own
          .page-header-icon.icon-expense color rather than sharing
          Notifications' class. */}
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
