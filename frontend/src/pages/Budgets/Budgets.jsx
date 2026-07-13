import { useEffect, useState } from "react";
import { LuPlus, LuPencil, LuTrash2, LuTarget } from "react-icons/lu";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import BudgetForm from "./BudgetForm";
import { listBudgets, createBudget, updateBudget, deleteBudget } from "../../services/budgetService";
// Reusing the already-tested Dashboard aggregation instead of
// re-implementing "spend per category" here - the summary endpoint's
// budget_utilization already computes exactly what this page needs to
// show (spent vs. limit), so it's called directly rather than
// duplicating the Expense-aggregation logic that lives in analytics/.
import { getDashboardSummary } from "../../services/dashboardService";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const today = new Date();

function BudgetCard({ budget, onEdit, onDelete }) {
  const percent = budget.percent_used ?? 0;
  const barColor =
    percent >= 100 ? "var(--color-danger)" : percent >= 70 ? "var(--color-warning)" : "var(--color-income)";

  return (
    <div className="col-md-4">
      <div className="bg-surface rounded shadow-token-sm p-3 h-100">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className="badge bg-surface-sunken text-ink">{budget.category}</span>
          <div>
            <button className="btn btn-sm btn-link text-muted-ink p-1" onClick={() => onEdit(budget)} aria-label="Edit">
              <LuPencil size={14} />
            </button>
            <button className="btn btn-sm btn-link text-danger p-1" onClick={() => onDelete(budget)} aria-label="Delete">
              <LuTrash2 size={14} />
            </button>
          </div>
        </div>

        <div className="font-currency small mb-1">
          <span className="text-expense">₹{Number(budget.spent ?? 0).toFixed(2)}</span>
          <span className="text-muted-ink"> of ₹{Number(budget.monthly_limit).toFixed(2)}</span>
        </div>

        <div className="progress" style={{ height: 6 }}>
          <div
            className="progress-bar"
            style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: barColor }}
          />
        </div>
        <div className="small text-muted-ink mt-1">{percent.toFixed(1)}% used</div>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="font-display fs-3 fw-semibold mb-0">Budgets</h1>
        <Button icon={LuPlus} onClick={openAddModal}>
          Add Budget
        </Button>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <Input
            as="select"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            options={MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }))}
          />
        </div>
        <div className="col-md-2">
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      {loading ? (
        <div className="text-muted-ink small">Loading...</div>
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
