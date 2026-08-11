import TransactionHistory from "./TransactionHistory";
import { formatCurrency } from "../../utils/formatCurrency";
import Button from "../../components/ui/Button";
import {
  LuCalendarDays,
  LuClock3,
  LuPencil,
  LuTrash2,
  LuTarget,
  LuPiggyBank,
  LuWallet,
  LuCircleCheckBig,
} from "react-icons/lu";

function GoalCard({
  goal,
  onAddSavings,
  onWithdraw,
  onPurchase,
  onEdit,
  onDelete,
}) {
  const progress = Math.min(
    Number(goal.progress_percentage),
    100
  );

  const remaining =
    Number(goal.target_amount) -
    Number(goal.current_amount);

  const today = new Date();

  const targetDate = new Date(goal.target_date);

  const daysLeft = Math.ceil(
    (targetDate - today) /
      (1000 * 60 * 60 * 24)
  );

  // Same status thresholds as before - only the badge treatment
  // changed (rounded-pill + a "-subtle" tone for every state, not
  // just "On Track") so the indicator reads as a small, consistent
  // status pill rather than a solid block of color, matching how
  // priority/category badges look everywhere else in the app.
  let status = "On Track";
  let badge = "bg-success-subtle text-success";

  if (goal.is_completed) {
    status = "Ready to Purchase";
    badge = "bg-success-subtle text-success";
  } else if (daysLeft < 0) {
    status = "Overdue";
    badge = "bg-danger-subtle text-danger";
  } else if (daysLeft <= 14) {
    status = "Near Deadline";
    badge = "bg-warning-subtle text-warning";
  }

  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-4 h-100 d-flex flex-column">

      {/* ================= Header ================= */}

      <div className="d-flex justify-content-between align-items-start gap-2">

          <div className="d-flex align-items-start gap-3 min-w-0">
            <span className="category-icon bg-primary-subtle text-primary flex-shrink-0">
              <LuTarget size={16} />
            </span>
            <div className="min-w-0">
              <h5 className="fw-semibold mb-1 text-truncate">
                {goal.goal_name}
              </h5>

              <p className="text-muted-ink small mb-0">
                {goal.description || "No description"}
              </p>
            </div>
          </div>

          <span className={`badge rounded-pill ${badge} flex-shrink-0`}>
            {status}
          </span>

        </div>

        {/* ================= Progress ================= */}

        <div className="mt-3">

          <div className="d-flex justify-content-between align-items-center mb-2">

            <span className="fw-semibold">
              {progress.toFixed(0)}%
            </span>

            <small className="text-muted-ink font-currency">

              {formatCurrency(goal.current_amount)}
              {" / "}
              {formatCurrency(goal.target_amount)}

            </small>

          </div>

          <div
            className="progress progress-track"
            style={{
              height: 6,
            }}
          >
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${progress}%`,
                backgroundColor: "var(--color-income)",
              }}
            />
          </div>

        </div>

        {/* ================= Goal Info ================= */}

        <div className="mt-3 small">

          <div className="d-flex justify-content-between mb-2">

            <span className="text-muted-ink">
              Remaining
            </span>

            <span className="fw-semibold font-currency">
              {formatCurrency(remaining)}
            </span>

          </div>

          <div className="d-flex justify-content-between mb-2">

            <span className="text-muted-ink d-flex align-items-center gap-2">

              <LuCalendarDays size={14} />

              Target

            </span>

            <span className="fw-medium">
              {targetDate.toLocaleDateString()}
            </span>

          </div>

          <div className="d-flex justify-content-between">

            <span className="text-muted-ink d-flex align-items-center gap-2">

              <LuClock3 size={14} />

              Days Left

            </span>

            <span className="fw-medium">

              {goal.is_completed
                ? "-"
                : Math.max(daysLeft, 0)}

            </span>

          </div>

        </div>

        {/* ================= Bottom Section ================= */}

        <div className="mt-auto pt-3">

          <TransactionHistory
            transactions={goal.transactions || []}
          />

          {!goal.is_completed && (
            <div className="d-flex gap-2 mt-3">
              <Button
                variant="primary"
                icon={LuPiggyBank}
                className="flex-grow-1"
                onClick={() => onAddSavings(goal)}
              >
                Add Savings
              </Button>

              <Button
                variant="secondary"
                icon={LuWallet}
                className="flex-grow-1"
                onClick={() => onWithdraw(goal)}
              >
                Withdraw
              </Button>
            </div>
          )}

          {goal.is_completed && !goal.is_purchased && (
            <Button
              variant="primary"
              className="w-100 mt-3"
              onClick={() => onPurchase(goal)}
            >
              🎉 Purchase Completed
            </Button>
          )}

          {goal.is_purchased && (
            <div className="token-callout-success d-flex align-items-center gap-2 p-2 mt-3">
              <LuCircleCheckBig size={18} className="flex-shrink-0" />
              <div className="small">
                <span className="fw-semibold">Purchased</span>
                <span className="text-muted-ink"> &middot; {goal.purchase_date}</span>
              </div>
            </div>
          )}

          <div className="d-flex gap-2 mt-2">

            <Button
              variant="secondary"
              icon={LuPencil}
              className="flex-grow-1"
              onClick={() => onEdit(goal)}
            >
              Edit
            </Button>

            <Button
              variant="danger"
              icon={LuTrash2}
              className="flex-grow-1"
              onClick={() => onDelete(goal)}
            >
              Delete
            </Button>

          </div>

        </div>

      </div>
  );
}

export default GoalCard;