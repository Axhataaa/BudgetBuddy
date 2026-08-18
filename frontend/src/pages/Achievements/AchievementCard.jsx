import {
  LuCalendarDays,
  LuCircleCheckBig,
  LuIndianRupee,
  LuTrash2,
  LuTrophy,
} from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";
import Button from "../../components/ui/Button";

function AchievementCard({
  goal,
  onViewJourney,
  onDelete,
}) {
  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-4 h-100 d-flex flex-column">

      {/* Header */}

      <div className="d-flex justify-content-between align-items-start mb-3 gap-2">

        <div className="d-flex align-items-start gap-3 min-w-0">
          <span className="category-icon bg-warning-subtle text-warning flex-shrink-0">
            <LuTrophy size={16} />
          </span>
          <div className="min-w-0">
            <h5 className="fw-semibold mb-1">
              {goal.goal_name}
            </h5>

            {goal.description && (
              <p className="text-muted-ink small mb-0">
                {goal.description}
              </p>
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <span className="badge rounded-pill bg-success-subtle text-success">
            Purchased
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

      <div className="d-flex justify-content-between align-items-center mb-3">

        <span className="text-muted-ink d-flex align-items-center gap-2">
          <LuIndianRupee size={14} />
          Purchase Value
        </span>

        <span className="fw-semibold font-currency">
          {formatCurrency(goal.target_amount)}
        </span>

      </div>

      {/* Purchase Date */}

      <div className="d-flex justify-content-between align-items-center mb-3">

        <span className="text-muted-ink d-flex align-items-center gap-2">
          <LuCalendarDays size={14} />
          Purchased On
        </span>

        <span className="fw-medium">
          {new Date(goal.purchase_date).toLocaleDateString()}
        </span>

      </div>

      {/* Purchase Note */}

      <div className="mt-3">

        <div className="text-muted-ink small fw-semibold text-uppercase mb-2" style={{ letterSpacing: "0.04em" }}>
          Purchase Note
        </div>

        <div className="bg-surface-sunken rounded p-3 small">

          {goal.purchase_note ? (

            goal.purchase_note

          ) : (

            <span className="text-muted-ink fst-italic">
              No purchase note added.
            </span>

          )}

        </div>

      </div>

      <div className="mt-auto pt-4">

        {}
        <div className="token-callout-success d-flex align-items-center gap-2 p-3">

          <LuCircleCheckBig
            size={20}
            className="flex-shrink-0"
          />

          <div>

            <div className="fw-semibold">
              Achievement Unlocked!
            </div>

            <div className="small text-muted-ink">
              Congratulations on reaching your goal. 🎉
            </div>

          </div>

        </div>

        <Button
          variant="secondary"
          className="w-100 mt-3"
          onClick={() => onViewJourney(goal)}
        >
          View Journey →
        </Button>

      </div>

    </div>
  );
}

export default AchievementCard;
