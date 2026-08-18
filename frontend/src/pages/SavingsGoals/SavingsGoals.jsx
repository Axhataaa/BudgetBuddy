import { useEffect, useMemo, useState } from "react";
import {
  listSavingsGoals,
  deleteSavingsGoal,
} from "../../services/savingsGoalService";
import { formatCurrency } from "../../utils/formatCurrency";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import GoalCard from "./GoalCard";
import GoalFormModal from "./GoalFormModal";
import {
  LuTarget,
  LuPlus,
  LuPiggyBank,
  LuWallet,
} from "react-icons/lu";
import AddSavingsModal from "./AddSavingsModal";
import WithdrawSavingsModal from "./WithdrawSavingsModal";
import PurchaseCompletedModal from "./PurchaseCompletedModal";
import { useToast } from "../../components/ui/Toast";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [selectedSavingsGoal, setSelectedSavingsGoal] = useState(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedWithdrawGoal, setSelectedWithdrawGoal] = useState(null);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPurchaseGoal, setSelectedPurchaseGoal] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // -----------------------------
  // Effects
  // -----------------------------

  useEffect(() => {
    loadGoals();
  }, []);

  // -----------------------------
  // API
  // -----------------------------

  async function loadGoals() {
    try {
      setLoading(true);

      const response = await listSavingsGoals();

      setGoals(response.results || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Couldn't load savings goals.");
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // Event Handlers   
  // -----------------------------

  function handleAddGoal() {
    setSelectedGoal(null);
    setShowModal(true);
  }

  function handleEditGoal(goal) {
    setSelectedGoal(goal);
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
      setDeleteTarget(null);
    } catch (error) {
      console.error(error);
      showToast("Failed to delete goal.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const {
    activeGoals,
    completedGoals,
    totalSaved,
    totalTarget,
  } = useMemo(() => {
    const active = goals.filter((goal) => !goal.is_completed);

    const completed = goals.filter((goal) => goal.is_completed);

    const saved = goals.reduce(
      (sum, goal) => sum + Number(goal.current_amount),
      0
    );

    const target = goals.reduce(
      (sum, goal) => sum + Number(goal.target_amount),
      0
    );

    return {
      activeGoals: active,
      completedGoals: completed,
      totalSaved: saved,
      totalTarget: target,
    };
  }, [goals]);

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
          value={activeGoals.length}
          icon={LuTarget}
        />

        <SummaryCard
          title="Saved Amount"
          value={formatCurrency(totalSaved)}
          icon={LuPiggyBank}
          colorClass="text-income"
        />

        <SummaryCard
          title="Target Amount"
          value={formatCurrency(totalTarget)}
          icon={LuWallet}
        />

        <SummaryCard
          title="Ready to Purchase"
          value={completedGoals.length}
          icon={LuTarget}
          colorClass="text-income"
        />

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

      {/* ================= Empty State ================= */}

      {!loading && !error && goals.length === 0 && (
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

      {/* ================= Goal Cards ================= */}

      {!loading && !error && goals.length > 0 && (
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
      )}

      <GoalFormModal
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
