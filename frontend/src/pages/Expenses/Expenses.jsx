import { useEffect, useState } from "react";
import { LuPlus, LuPencil, LuTrash2, LuSearch, LuWallet } from "react-icons/lu";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonRows from "../../components/ui/SkeletonRows";
import Pagination from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import ExpenseForm from "./ExpenseForm";
import { formatCurrency } from "../../utils/formatCurrency";
import { TIME_PERIOD_OPTIONS, getDateRangeForPeriod } from "../../utils/dateRanges";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "./expenseConstants";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../../services/expenseService";

const PAGE_SIZE = 20;

// Maps a human-readable sort label to the `ordering` param the backend
// already supports (ExpenseViewSet.ordering_fields, §15 of the API
// Design Doc) - no backend change needed, just exposing what's there.
const SORT_OPTIONS = [
  { value: "-date", label: "Latest First" },
  { value: "date", label: "Oldest First" },
  { value: "-amount", label: "Highest Amount" },
  { value: "amount", label: "Lowest Amount" },
];

export default function Expenses() {
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [ordering, setOrdering] = useState("-date");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const hasFilters = search || category || paymentMethod || timePeriod;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="font-display fs-3 fw-semibold mb-0">Expenses</h1>
        <Button icon={LuPlus} onClick={openAddModal}>
          Add Expense
        </Button>
      </div>

      <div className="row g-2 mb-2">
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
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">All payment methods</option>
            {PAYMENT_METHODS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
          >
            {TIME_PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {timePeriod === "custom" && (
        <div className="row g-2 mb-3">
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              aria-label="From date"
            />
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              aria-label="To date"
            />
          </div>
        </div>
      )}

      <div className={`bg-surface rounded shadow-token-sm ${timePeriod === "custom" ? "" : "mt-1"}`}>
        <table className="table mb-0 align-middle">
          <thead>
            <tr className="text-muted-ink small text-uppercase">
              <th>Title</th>
              <th>Category</th>
              <th>Payment</th>
              <th>Date</th>
              <th className="text-end">Amount</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} columns={6} />
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <div className="fw-medium">{expense.title}</div>
                    {expense.description && (
                      <div className="small text-muted-ink">{expense.description}</div>
                    )}
                  </td>
                  <td>
                    <span className="badge bg-surface-sunken text-ink">{expense.category}</span>
                  </td>
                  <td className="text-muted-ink">{expense.payment_method}</td>
                  <td className="text-muted-ink">{expense.date}</td>
                  <td className="text-end font-currency text-expense fw-medium">
                    -{formatCurrency(expense.amount)}
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-link text-muted-ink"
                      onClick={() => openEditModal(expense)}
                      aria-label="Edit"
                    >
                      <LuPencil size={16} />
                    </button>
                    <button
                      className="btn btn-sm btn-link text-danger"
                      onClick={() => setDeleteTarget(expense)}
                      aria-label="Delete"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && expenses.length === 0 && (
          <EmptyState
            icon={LuWallet}
            message={
              hasFilters
                ? "No expenses match your search or filters."
                : "No expenses yet — add your first one to get started."
            }
            action={
              !hasFilters && (
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
            ? `"${deleteTarget.title}" will be permanently deleted. This can't be undone.`
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
