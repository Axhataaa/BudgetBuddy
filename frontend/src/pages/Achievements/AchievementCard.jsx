import {
  LuCalendarDays,
  LuCircleCheckBig,
  LuIndianRupee,
} from "react-icons/lu";

function AchievementCard({
  goal,
  onViewJourney,
}) {
  return (
    <div className="col-lg-6 col-xl-4">

      <div className="bg-surface rounded shadow-token-sm hover-card p-4 h-100 d-flex flex-column">

        {/* Header */}

        <div className="d-flex justify-content-between align-items-start mb-3">

          <div>

            <h4 className="fw-bold mb-1">
              {goal.goal_name}
            </h4>

            {goal.description && (
              <p className="text-muted-ink mb-0">
                {goal.description}
              </p>
            )}

          </div>

          <span className="badge bg-success">
            Purchased ✓
          </span>

        </div>

        <hr />

        {/* Purchase Value */}

        <div className="d-flex justify-content-between mb-3">

          <span>
            <LuIndianRupee className="me-2" />
            Purchase Value
          </span>

          <strong>
            ₹{Number(goal.target_amount).toLocaleString()}
          </strong>

        </div>

        {/* Purchase Date */}

        <div className="d-flex justify-content-between mb-3">

          <span>
            <LuCalendarDays className="me-2" />
            Purchased On
          </span>

          <strong>
            {new Date(goal.purchase_date).toLocaleDateString()}
          </strong>

        </div>

        {/* Purchase Note */}

        <div className="mt-3">

          <div className="fw-semibold mb-2">
            📝 Purchase Note
          </div>

          <div className="bg-light border rounded p-3">

            {goal.purchase_note ? (

              goal.purchase_note

            ) : (

              <span className="text-muted fst-italic">
                No purchase note added.
              </span>

            )}

          </div>

        </div>

        <div className="mt-auto pt-4">

          <div className="alert alert-success d-flex align-items-center">

            <LuCircleCheckBig
              className="me-2"
              size={20}
            />

            <div>

              <strong>
                Achievement Unlocked!
              </strong>

              <div className="small">
                Congratulations on reaching your goal. 🎉
              </div>

            </div>

          </div>

          <button
            className="btn btn-outline-primary w-100 mt-3"
            onClick={() => onViewJourney(goal)}
          >
            View Journey →
          </button>

        </div>

      </div>

    </div>
  );
}

export default AchievementCard;