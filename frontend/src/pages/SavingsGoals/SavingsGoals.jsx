import { useEffect, useState } from "react";
import {
  listSavingsGoals,
  getSavingsGoalsSummary,
  deleteSavingsGoal,
} from "../../services/savingsGoalService";
import { formatCurrency } from "../../utils/formatCurrency";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import FilterChips from "../../components/ui/FilterChips";
import Pagination from "../../components/ui/Pagination";
import GoalCard from "./GoalCard";
import GoalFormModal from "./GoalFormModal";
import { GOAL_TYPES, GOAL_CATEGORIES } from "../../utils/goalOptions";
import { GOAL_SORT_OPTIONS } from "../../utils/sortOptions";
import {
  LuTarget,
  LuPlus,
  LuPiggyBank,
  LuWallet,
  LuSearch,
  LuFilterX,
} from "react-icons/lu";
import AddSavingsModal from "./AddSavingsModal";
import WithdrawSavingsModal from "./WithdrawSavingsModal";
import PurchaseCompletedModal from "./PurchaseCompletedModal";
import { useToast } from "../../components/ui/Toast";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All goals" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "purchased", label: "Purchased" },
];

const emptyFilters = {
  search: "",
  status: "",
  goalType: "",
  goalCategory: "",
};

function SummaryCard({
  title,
  value,
  icon: Icon,
  colorClass = "text-primary",
}) {
  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
      <div className="d-flex justify-content-between align-items-center gap-3">
        <div className="min-w-0">
          <small className="text-muted-ink d-block">{title}</small>
          <h3 className={`mt-1 mb-0 fw-bold text-truncate ${colorClass}`}>
            {value}
          </h3>
        </div>

        <div
          className={`category-icon ${colorClass === "text-income" ? "bg-success-subtle text-success" : "bg-primary-subtle text-primary"}`}
          style={{ width: 46, height: 46 }}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function SavingsGoals() {
  const { showToast } = useToast();

  // -----------------------------
  // State
  // -----------------------------

  const [goals, setGoals] = useState([]);
  const [count, setCount] = useState(0);

  // Summary cards must always reflect the user's complete savings-goal
  // dataset, independent of the filtered/sorted/paginated `goals` state
  // above. Kept in its own state, backed by a separate summary endpoint,
  // and only refreshed on mount and after goal-mutating actions - never
  // when search/filter/sort/page changes.
  const [summary, setSummary] = useState({
    active_goals: 0,
    completed_goals: 0,
    saved_amount: 0,
    target_amount: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState(emptyFilters);
  const { search, status, goalType, goalCategory } = filters;
  const [ordering, setOrdering] = useState("target_date");

  const [showModal, setShowModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [selectedSavingsGoal, setSelectedSavingsGoal] = useState(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedWithdrawGoal, setSelectedWithdrawGoal] = useState(null);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPurchaseGoal, setSelectedPurchaseGoal] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const setFilter = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  // -----------------------------
  // API
  // -----------------------------

  async function loadGoals() {
    try {
      setLoading(true);

      const params = { page, page_size: PAGE_SIZE, ordering };
      if (search) params.search = search;
      if (status) params.status = status;
      if (goalType) params.goal_type = goalType;
      if (goalCategory) params.goal_category = goalCategory;

      const response = await listSavingsGoals(params);

      setGoals(response.results || []);
      setCount(response.count ?? (response.results || []).length);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Couldn't load savings goals.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary() {
    try {
      const response = await getSavingsGoalsSummary();
      setSummary(response);
    } catch (err) {
      console.error(err);
    }
  }

  // -----------------------------
  // Effects
  // -----------------------------

  useEffect(() => {
    const timer = setTimeout(loadGoals, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, goalType, goalCategory, ordering, page]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, goalType, goalCategory, ordering]);

  // Summary only loads once on mount - it must NOT refetch when
  // search/filter/sort/page change. It refreshes separately after
  // goal-mutating actions (see loadSummary() calls below).
  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------
  // Event Handlers   
  // -----------------------------

  function handleAddGoal() {
    setSelectedGoal(null);
    setFormKey((key) => key + 1);
    setShowModal(true);
  }

  function handleEditGoal(goal) {
    setSelectedGoal(goal);
    setFormKey((key) => key + 1);
    setShowModal(true);
  }

  function handleAddSavings(goal) {
    setSelectedSavingsGoal(goal);
    setShowSavingsModal(true);
  }

  function handleWithdraw(goal) {
    setSelectedWithdrawGoal(goal);
    setShowWithdrawModal(true);
  }

  function handlePurchase(goal) {
  setSelectedPurchaseGoal(goal);
    setShowPurchaseModal(true);
  }

  function handleDeleteGoal(goal) {
    setDeleteTarget(goal);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSavingsGoal(deleteTarget.id);
      await loadGoals();
      await loadSummary();
      setDeleteTarget(null);
    } catch (error) {
      console.error(error);
      showToast("Failed to delete goal.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = Boolean(search || status || goalType || goalCategory);

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label;
  const goalTypeLabel = GOAL_TYPES.find((o) => o.value === goalType)?.label;
  const goalCategoryLabel = GOAL_CATEGORIES.find((o) => o.value === goalCategory)?.label;

  const chips = [
    search && { key: "search", label: `Search: "${search}"`, onRemove: () => setFilter("search")("") },
    status && { key: "status", label: `Status: ${statusLabel}`, onRemove: () => setFilter("status")("") },
    goalType && { key: "type", label: `Type: ${goalTypeLabel}`, onRemove: () => setFilter("goalType")("") },
    goalCategory && {
      key: "category",
      label: `Category: ${goalCategoryLabel}`,
      onRemove: () => setFilter("goalCategory")(""),
    },
  ].filter(Boolean);

  return (
    <div>

      {/* ================= Header ================= */}

      <div className="bg-surface rounded shadow-token-sm p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">

        <div className="d-flex align-items-center gap-3">
          <span className="page-header-icon icon-savings">
            <LuTarget size={22} />
          </span>
          <div>
            <h1 className="font-display fs-3 fw-semibold mb-1">
              Savings Goals
            </h1>

            <p className="text-muted-ink mb-0">
              Plan, track and achieve your financial goals.
            </p>
          </div>
        </div>

        <Button icon={LuPlus} onClick={handleAddGoal}>
          Add Goal
        </Button>

      </div>

      {/* ================= Summary ================= */}

      <div className="savings-summary-grid mb-4">

        <SummaryCard
          title="Active Goals"
          value={summary.active_goals}
          icon={LuTarget}
        />

        <SummaryCard
          title="Saved Amount"
          value={formatCurrency(summary.saved_amount)}
          icon={LuPiggyBank}
          colorClass="text-income"
        />

        <SummaryCard
          title="Target Amount"
          value={formatCurrency(summary.target_amount)}
          icon={LuWallet}
        />

        <SummaryCard
          title="Goals Completed"
          value={summary.completed_goals}
          icon={LuTarget}
          colorClass="text-income"
        />

      </div>

      {/* ================= Filters ================= */}

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
                placeholder="Search by goal name or description..."
                value={search}
                onChange={(e) => setFilter("search")(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={status} onChange={(e) => setFilter("status")(e.target.value)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={goalType} onChange={(e) => setFilter("goalType")(e.target.value)}>
              <option value="">All types</option>
              {GOAL_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={goalCategory}
              onChange={(e) => setFilter("goalCategory")(e.target.value)}
            >
              <option value="">All categories</option>
              {GOAL_CATEGORIES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
              {GOAL_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between">
        <FilterChips chips={chips} />
        {hasFilters && (
          <Button variant="ghost" icon={LuFilterX} onClick={() => setFilters(emptyFilters)} className="mb-3">
            Clear Filters
          </Button>
        )}
      </div>

      {/* ================= Loading ================= */}

      {loading && (
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary"
            role="status"
          />
        </div>
      )}

      {/* ================= Error ================= */}

      {!loading && error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* ================= Empty State (no goals at all) ================= */}

      {!loading && !error && goals.length === 0 && !hasFilters && (
        <div className="bg-surface rounded shadow-token-sm hover-card p-5 text-center">

          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-surface-sunken mb-4"
            style={{
              width: 84,
              height: 84,
            }}
          >
            <LuTarget
              size={38}
              className="text-primary"
            />
          </div>

          <h3 className="fw-bold mb-3">
            No Savings Goals Yet
          </h3>

          <p
            className="text-muted-ink mx-auto mb-4"
            style={{
              maxWidth: 520,
            }}
          >
            Start saving for something meaningful.
            Create your first savings goal to monitor your progress,
            stay motivated,
            and celebrate every milestone along the way.
          </p>

          <Button icon={LuPlus} size="lg" onClick={handleAddGoal}>
            Create Your First Goal
          </Button>

        </div>
      )}

      {/* ================= Empty State (filters matched nothing) ================= */}

      {!loading && !error && goals.length === 0 && hasFilters && (
        <div className="bg-surface rounded shadow-token-sm hover-card">
          <EmptyState
            icon={LuTarget}
            message="No savings goals match your search or filters."
            action={
              <Button variant="ghost" icon={LuFilterX} onClick={() => setFilters(emptyFilters)}>
                Clear Filters
              </Button>
            }
          />
        </div>
      )}

      {/* ================= Goal Cards ================= */}

      {!loading && !error && goals.length > 0 && (
        <>
          <div className="goals-grid">

            {goals.map((goal) => (
              <GoalCard
                  key={goal.id}
                  goal={goal}
                  onAddSavings={handleAddSavings}
                  onWithdraw={handleWithdraw}
                  onPurchase={handlePurchase}
                  onEdit={handleEditGoal}
                  onDelete={handleDeleteGoal}
              />
            ))}

          </div>

          <div className="bg-surface rounded shadow-token-sm mt-3">
            <Pagination count={count} pageSize={PAGE_SIZE} page={page} onPageChange={setPage} />
          </div>
        </>
      )}

      <GoalFormModal
        key={formKey}
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
        onSuccess={() => {
          setShowModal(false);
          setSelectedGoal(null);
          loadGoals();
          loadSummary();
        }}
      />

      <AddSavingsModal
        show={showSavingsModal}
        goal={selectedSavingsGoal}
        onHide={() => {
            setShowSavingsModal(false);
            setSelectedSavingsGoal(null);
        }}
        onSuccess={() => {
            setShowSavingsModal(false);
            setSelectedSavingsGoal(null);
            loadGoals();
            loadSummary();
        }}
      />

      <WithdrawSavingsModal
        show={showWithdrawModal}
        goal={selectedWithdrawGoal}
        onHide={() => {
          setShowWithdrawModal(false);
          setSelectedWithdrawGoal(null);
        }}
        onSuccess={() => {
          setShowWithdrawModal(false);
          setSelectedWithdrawGoal(null);
          loadGoals();
          loadSummary();
        }}
      />

      <PurchaseCompletedModal
          show={showPurchaseModal}
          goal={selectedPurchaseGoal}
          onHide={() => {
              setShowPurchaseModal(false);
              setSelectedPurchaseGoal(null);
          }}
          onSuccess={() => {
              setShowPurchaseModal(false);
              setSelectedPurchaseGoal(null);
              loadGoals();
              loadSummary();
          }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this goal?"
        message={deleteTarget ? `Delete "${deleteTarget.goal_name}"? This can't be undone.` : ""}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
}

export default SavingsGoals;
