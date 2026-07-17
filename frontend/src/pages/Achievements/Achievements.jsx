import { useEffect, useMemo, useState } from "react";

import {
  LuAward,
  LuIndianRupee,
  LuTrophy,
} from "react-icons/lu";

import { listAchievements } from "../../services/achievementService";

import AchievementCard from "./AchievementCard";
import AchievementJourneyModal from "./AchievementJourneyModal";

function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="bg-surface rounded shadow-token-sm p-3 h-100">

      <div className="d-flex justify-content-between">

        <div>

          <small className="text-muted-ink">
            {title}
          </small>

          <h3 className="fw-bold mt-2">
            {value}
          </h3>

        </div>

        <Icon size={24} />

      </div>

    </div>
  );
}

function Achievements() {

  const [goals, setGoals] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showJourney, setShowJourney] =
    useState(false);

  const [selectedGoal, setSelectedGoal] =
    useState(null);

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

  const totalAmount = useMemo(() => {

    return goals.reduce(
      (sum, goal) =>
        sum + Number(goal.current_amount),
      0
    );

  }, [goals]);

  if (loading) {

    return (
      <div className="text-center py-5">
        Loading...
      </div>
    );

  }

  return (

    <div className="container-fluid py-4">

      {/* Header */}

      <div className="mb-4">

        <h2 className="fw-bold">
          🏆 Achievements
        </h2>

        <p className="text-muted-ink">
          Celebrate your completed financial goals.
        </p>

      </div>

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
            value={`₹${totalAmount.toLocaleString()}`}
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

        <div className="row g-4">

          {goals.map((goal) => (

            <AchievementCard
              key={goal.id}
              goal={goal}
              onViewJourney={handleViewJourney}
            />

          ))}

        </div>

      )}

      <AchievementJourneyModal
        show={showJourney}
        goal={selectedGoal}
        onHide={() => {

          setShowJourney(false);

          setSelectedGoal(null);

        }}
      />

    </div>

  );
}

export default Achievements;