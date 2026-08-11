import { useEffect, useMemo, useState } from "react";

import {
  LuAward,
  LuIndianRupee,
  LuTrophy,
} from "react-icons/lu";

import { listAchievements, deleteAchievement } from "../../services/achievementService";
import { formatCurrency } from "../../utils/formatCurrency";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

import AchievementCard from "./AchievementCard";
import AchievementJourneyModal from "./AchievementJourneyModal";

function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">

      <div className="d-flex justify-content-between align-items-center gap-3">

        <div className="min-w-0">

          <small className="text-muted-ink">
            {title}
          </small>

          <h3 className="fw-bold mt-1 mb-0 text-truncate">
            {value}
          </h3>

        </div>

        <span className="category-icon bg-warning-subtle text-warning" style={{ width: 46, height: 46 }}>
          <Icon size={22} />
        </span>

      </div>

    </div>
  );
}

function Achievements() {

  const { showToast } = useToast();

  const [goals, setGoals] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showJourney, setShowJourney] =
    useState(false);

  const [selectedGoal, setSelectedGoal] =
    useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    try {

      const data =
        await listAchievements();

      setGoals(data);

    } finally {

      setLoading(false);

    }
  }

  function handleViewJourney(goal) {

    setSelectedGoal(goal);

    setShowJourney(true);

  }

  function handleDeleteRequest(goal) {
    setDeleteTarget(goal);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteAchievement(deleteTarget.id);
      setGoals((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      showToast("Achievement deleted.", "success");
      setDeleteTarget(null);
    } catch {
      showToast("Couldn't delete this achievement. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const totalAmount = useMemo(() => {

    return goals.reduce(
      (sum, goal) =>
        sum + Number(goal.current_amount),
      0
    );

  }, [goals]);

  return (

    <div>

      {/* Header */}

      <div className="bg-surface rounded shadow-token-sm p-4 mb-4 d-flex align-items-center gap-3">
        <span className="page-header-icon icon-achievements">
          <LuAward size={22} />
        </span>
        <div>
          <h1 className="font-display fs-3 fw-semibold mb-1">
            Achievements
          </h1>

          <p className="text-muted-ink mb-0">
            Celebrate your completed financial goals.
          </p>
        </div>
      </div>

      {loading ? (

        // Matches the Savings Goals page's loading pattern (a
        // centered Bootstrap spinner within the normal page layout,
        // not a bare "Loading..." text replacing the whole page) -
        // this used to be an early return before the header, so the
        // page title disappeared and reappeared as loading finished.
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary"
            role="status"
          />
        </div>

      ) : (

        <>

          {/* Summary */}

          <div className="row g-3 mb-4">

            <div className="col-md-6">

              <SummaryCard
                title="Goals Achieved"
                value={goals.length}
                icon={LuAward}
              />

            </div>

            <div className="col-md-6">

              <SummaryCard
                title="Total Value Achieved"
                value={formatCurrency(totalAmount)}
                icon={LuIndianRupee}
              />

            </div>

          </div>

          {/* Empty State */}

          {goals.length === 0 ? (

            <div className="bg-surface rounded shadow-token-sm p-5 text-center">

              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-surface-sunken mb-4"
                style={{
                  width: 90,
                  height: 90,
                }}
              >

                <LuTrophy
                  size={40}
                  className="text-warning"
                />

              </div>

              <h3 className="fw-bold">
                No Achievements Yet
              </h3>

              <p
                className="text-muted-ink mx-auto"
                style={{
                  maxWidth: 500,
                }}
              >
                Complete your first savings goal and
                mark it as purchased to unlock your
                first achievement.
              </p>

            </div>

          ) : (


            <div className="goals-grid">

              {goals.map((goal) => (

                <AchievementCard
                  key={goal.id}
                  goal={goal}
                  onViewJourney={handleViewJourney}
                  onDelete={handleDeleteRequest}
                />

              ))}

            </div>

          )}

        </>

      )}

      <AchievementJourneyModal
        show={showJourney}
        goal={selectedGoal}
        onHide={() => {

          setShowJourney(false);

          setSelectedGoal(null);

        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this achievement?"
        message={
          deleteTarget
            ? `This removes "${deleteTarget.goal_name}" from your achievement history. This can't be undone, and it won't recreate the goal or affect your income/expense records.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>

  );
}

export default Achievements;
