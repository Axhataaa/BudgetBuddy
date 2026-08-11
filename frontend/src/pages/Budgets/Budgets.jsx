import { useEffect, useState } from "react";
import { LuPlus, LuPencil, LuTrash2, LuTarget } from "react-icons/lu";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import PeriodSelector, { MONTH_NAMES } from "../../components/ui/PeriodSelector";
import { useToast } from "../../components/ui/Toast";
import BudgetForm from "./BudgetForm";
import { formatCurrency } from "../../utils/formatCurrency";
import { getBudgetStatusColor } from "../../utils/budgetStatus";
import { getExpenseCategoryMeta } from "../Expenses/expenseConstants";
import { listBudgets, createBudget, updateBudget, deleteBudget } from "../../services/budgetService";
// Reusing the already-tested Dashboard aggregation instead of
// re-implementing "spend per category" here - the summary endpoint's
// budget_utilization already computes exactly what this page needs to
// show (spent vs. limit), so it's called directly rather than
// duplicating the Expense-aggregation logic that lives in analytics/.
import { getDashboardSummary } from "../../services/dashboardService";

const today = new Date();

function BudgetCardSkeleton() {
  return (
    <div className="col-6 col-md-4">
      <div className="bg-surface rounded shadow-token-sm hover-card p-3">
        <span className="placeholder-glow d-block mb-2">
          <span className="placeholder col-4" />
        </span>
        <span className="placeholder-glow d-block mb-2">
          <span className="placeholder col-7" />
        </span>
        <span className="placeholder-glow d-block">
          <span className="placeholder col-12" style={{ height: 6 }} />
        </span>
      </div>
    </div>
  );
}

function BudgetCard({ budget, onEdit, onDelete }) {
  const percent = budget.percent_used ?? 0;
  const spent = Number(budget.spent ?? 0);
  const limit = Number(budget.monthly_limit);
  const remaining = limit - spent;
  const barColor = getBudgetStatusColor(percent);
  // Budgets share the exact same category list as Expenses (see
  // BudgetForm.jsx, which already imports EXPENSE_CATEGORIES directly)
  // - so the same icon/tint metadata applies unchanged, giving a
  // budget for "Food" the identical badge a Food expense already gets
  // on the Expenses page, rather than a second, different mapping.
  const meta = getExpenseCategoryMeta(budget.category);
  const CategoryIcon = meta.icon;

  return (
    <div className="col-6 col-md-4">
      <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center gap-2">
            <span className={`category-icon ${meta.badge}`}>
              <CategoryIcon size={16} />
            </span>
            <span className={`badge rounded-pill ${meta.badge}`}>{budget.category}</span>
          </div>
          <div>
            <button
              className="btn btn-sm btn-link text-muted-ink p-1 icon-action-btn"
              onClick={() => onEdit(budget)}
              aria-label="Edit"
            >
              <LuPencil size={14} />
            </button>
            <button
              className="btn btn-sm btn-link text-danger p-1 icon-action-btn"
              onClick={() => onDelete(budget)}
              aria-label="Delete"
            >
              <LuTrash2 size={14} />
            </button>
          </div>
        </div>

        <div className="font-currency mb-1">
          <span className="text-expense fs-5 fw-medium">{formatCurrency(spent)}</span>
          <span className="text-muted-ink small"> of {formatCurrency(limit)}</span>
        </div>

        <div className="progress progress-track" style={{ height: 5 }}>
          <div
            className="progress-bar"
            style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: barColor }}
          />
        </div>

        <div className="d-flex justify-content-between small text-muted-ink mt-2">
          <span style={{ color: remaining < 0 ? "var(--color-danger)" : undefined }}>
            {remaining < 0 ? "Over by " : "Remaining: "}
            {formatCurrency(Math.abs(remaining))}
          </span>
          <span className="fw-medium" style={{ color: barColor }}>{percent.toFixed(1)}% used</span>
        </div>
      </div>
    </div>
  );
}

export default function Budgets() {
  const { showToast } = useToast();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const [budgetsData, summaryData] = await Promise.all([
        listBudgets({ month, year }),
        getDashboardSummary({ month, year }),
      ]);

      // Merge: budgetsData has id (needed for edit/delete), summary's
      // budget_utilization has spent/percent_used (needed for display).
      // Both are scoped to the same category, so a simple lookup joins
      // them - the alternative (recomputing spend here) would duplicate
      // logic that's already correct and tested in analytics/views.py.
      const utilizationByCategory = Object.fromEntries(
        summaryData.budget_utilization.map((u) => [u.category, u])
      );

      const merged = budgetsData.results.map((b) => ({
        ...b,
        spent: utilizationByCategory[b.category]?.spent ?? "0.00",
        percent_used: utilizationByCategory[b.category]?.percent_used ?? 0,
      }));

      setBudgets(merged);
    } catch {
      showToast("Couldn't load budgets. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const openAddModal = () => {
    setEditingBudget(null);
    setModalOpen(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setModalOpen(true);
  };

  const handleSubmit = async (formValues) => {
    setSubmitting(true);
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, formValues);
        showToast("Budget updated.", "success");
      } else {
        await createBudget(formValues);
        showToast("Budget added.", "success");
      }
      setModalOpen(false);
      fetchBudgets();
    } catch (err) {
      const message = err.response?.data?.error?.message || "Couldn't save budget.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBudget(deleteTarget.id);
      showToast("Budget deleted.", "success");
      setDeleteTarget(null);
      fetchBudgets();
    } catch {
      showToast("Couldn't delete budget.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header - same bg-surface card + tinted icon container
          structure as Expenses/Income/Notifications. */}
      <div className="bg-surface rounded shadow-token-sm p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <span className="page-header-icon icon-budget">
            <LuTarget size={22} />
          </span>
          <div>
            <h1 className="font-display fs-3 fw-semibold mb-1">Budgets</h1>
            <p className="text-muted-ink mb-0">Set monthly limits and track spending by category.</p>
          </div>
        </div>

        <Button icon={LuPlus} onClick={openAddModal}>
          Add Budget
        </Button>
      </div>

      <div className="bg-surface rounded shadow-token-sm p-3 mb-3 d-inline-flex">
        <PeriodSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      {loading ? (
        <div className="row g-3">
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={LuTarget}
          message={`No budgets set for ${MONTH_NAMES[month - 1]} ${year} — add one to start tracking.`}
          action={
            <Button icon={LuPlus} onClick={openAddModal}>
              Add Budget
            </Button>
          }
        />
      ) : (
        <div className="row g-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBudget ? "Edit Budget" : "Add Budget"}
      >
        <BudgetForm
          initialValues={editingBudget}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this budget?"
        message={
          deleteTarget
            ? `The budget for "${deleteTarget.category}" will be permanently deleted. This can't be undone.`
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
