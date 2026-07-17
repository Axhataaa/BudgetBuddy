import TransactionHistory from "./TransactionHistory";
import {
  LuCalendarDays,
  LuClock3,
  LuPencil,
  LuTrash2,
  LuTarget,
  LuPiggyBank,
  LuWallet,
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

  let status = "On Track";
  let badge = "bg-success-subtle text-success";

  if (goal.is_completed) {
    status = "Completed";
    badge = "bg-success text-white";
  } else if (daysLeft < 0) {
    status = "Overdue";
    badge = "bg-danger text-white";
  } else if (daysLeft <= 14) {
    status = "Near Deadline";
    badge = "bg-warning text-dark";
  }

  return (
    <div className="col-xl-4 col-lg-6">

      <div className="bg-surface rounded shadow-token-sm hover-card p-4 h-100 d-flex flex-column">

        {/* ================= Header ================= */}

        <div className="d-flex justify-content-between align-items-start">

          <div>

            <h5 className="fw-bold mb-1 d-flex align-items-center">

              <LuTarget className="me-2 text-primary" />

              {goal.goal_name}

            </h5>

            <p className="text-muted-ink mb-0">

              {goal.description || "No description"}

            </p>

          </div>

          <span className={`badge ${badge}`}>
            {status}
          </span>

        </div>

        {/* ================= Progress ================= */}

        <div className="mt-4">

          <div className="d-flex justify-content-between mb-2">

            <strong>
              {progress.toFixed(0)}%
            </strong>

            <small className="text-muted">

              ₹{Number(goal.current_amount).toLocaleString()}
              {" / "}
              ₹{Number(goal.target_amount).toLocaleString()}

            </small>

          </div>

          <div
            className="progress"
            style={{
              height: 10,
            }}
          >
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

        </div>

        {/* ================= Goal Info ================= */}

        <div className="mt-4">

          <div className="d-flex justify-content-between mb-2">

            <span className="text-muted-ink">
              Remaining
            </span>

            <strong>
              ₹{remaining.toLocaleString()}
            </strong>

          </div>

          <div className="d-flex justify-content-between mb-2">

            <span>

              <LuCalendarDays className="me-2" />

              Target

            </span>

            <strong>
              {targetDate.toLocaleDateString()}
            </strong>

          </div>

          <div className="d-flex justify-content-between">

            <span>

              <LuClock3 className="me-2" />

              Days Left

            </span>

            <strong>

              {goal.is_completed
                ? "-"
                : Math.max(daysLeft, 0)}

            </strong>

          </div>

        </div>

        {/* ================= Bottom Section ================= */}

        <div className="mt-auto pt-4">

          <TransactionHistory
            transactions={goal.transactions || []}
          />

          {!goal.is_completed && (
            <>
              <button
                className="btn btn-success w-100 mt-4 mb-2"
                onClick={() => onAddSavings(goal)}
              >
                <LuPiggyBank className="me-2" />
                Add Savings
              </button>

              <button
                className="btn btn-outline-warning w-100 mb-3"
                onClick={() => onWithdraw(goal)}
              >
                Withdraw
              </button>
            </>
          )}

          {goal.is_completed && !goal.is_purchased && (
            <button
              className="btn btn-warning w-100 mt-4 mb-3"
              onClick={() => onPurchase(goal)}
            >
              🎉 Purchase Completed
            </button>
          )}

          {goal.is_purchased && (
            <div className="alert alert-success mt-4 mb-3">
              <strong>✓ Purchased</strong>

              <br />

              {goal.purchase_date}
            </div>
          )}

          <div className="d-flex gap-2 mt-3">

            <button
              className="btn btn-outline-primary flex-grow-1"
              onClick={() => onEdit(goal)}
            >

              <LuPencil className="me-2" />

              Edit

            </button>

            <button
              className="btn btn-outline-danger flex-grow-1"
              onClick={() => onDelete(goal)}
            >

              <LuTrash2 className="me-2" />

              Delete

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default GoalCard;