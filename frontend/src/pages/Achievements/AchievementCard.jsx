import {
  LuCalendarDays,
  LuCircleCheckBig,
  LuIndianRupee,
  LuTrash2,
} from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";

function AchievementCard({
  goal,
  onViewJourney,
  onDelete,
}) {
  return (
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

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success">
            Purchased ✓
          </span>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center p-1"
            style={{ width: 30, height: 30 }}
            onClick={() => onDelete?.(goal)}
            aria-label="Delete achievement"
            title="Delete achievement"
          >
            <LuTrash2 size={14} />
          </button>
        </div>

      </div>

      <hr />

      {/* Purchase Value */}

      <div className="d-flex justify-content-between mb-3">

        <span>
          <LuIndianRupee className="me-2" />
          Purchase Value
        </span>

        <strong>
          {formatCurrency(goal.target_amount)}
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

        <div className="bg-surface-sunken border rounded p-3">

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
  );
}

export default AchievementCard;
