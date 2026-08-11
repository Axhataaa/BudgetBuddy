import {
  LuCircleCheckBig,
  LuFlag,
  LuPiggyBank,
  LuWallet,
} from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";

function AchievementJourneyModal({
  show,
  goal,
  onHide,
}) {
  if (!show || !goal) {
    return null;
  }

    const timeline = [
    {
        id: "created",
        type: "created",
        title: "Goal Created",
        description: "Your savings journey began.",
        date: goal.created_at,
    },

    ...(goal.transactions || []).map((transaction) => ({
        id: transaction.id,
        type: transaction.transaction_type,
        amount: Number(transaction.transaction_amount),
        description:
        transaction.note || "No note provided.",
        date: transaction.created_at,
    })),

    {
        id: "purchased",
        type: "purchased",
        title: "Purchase Completed 🎉",
        description:
        goal.purchase_note ||
        "No note was added during purchase.",
        date: goal.purchase_date,
    },
    ].sort(
    (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );

    /* Always keep Purchase as the final milestone */
    const purchaseEvent = timeline.find(
    (item) => item.type === "purchased"
    );

    const orderedTimeline = [
    ...timeline.filter(
        (item) => item.type !== "purchased"
    ),
    ...(purchaseEvent ? [purchaseEvent] : []),
    ];

    const totalDeposited = orderedTimeline
    .filter(
        (item) => item.type === "deposit"
    )
    .reduce(
        (sum, item) =>
        sum + (item.amount || 0),
        0
    );

    const totalWithdrawn = orderedTimeline
    .filter(
        (item) =>
        item.type === "withdrawal"
    )
    .reduce(
        (sum, item) =>
        sum + (item.amount || 0),
        0
    );

    const totalTransactions = orderedTimeline.filter(
    (item) =>
        item.type === "deposit" ||
        item.type === "withdrawal"
    ).length;

    const daysTaken = Math.max(
    1,
    Math.ceil(
        (
        new Date(goal.purchase_date) -
        new Date(goal.created_at)
        ) /
        (1000 * 60 * 60 * 24)
    )
    );

  function getEvent(item) {
    switch (item.type) {
      case "created":
        return {
          icon: LuFlag,
          iconClass: "bg-primary",
          title: item.title,
          subtitle: item.description,
        };

      case "deposit":
        return {
          icon: LuPiggyBank,
          iconClass: "bg-success",
          title: `Saved ${formatCurrency(item.amount)}`,
          subtitle: item.description,
        };

      case "withdrawal":
        return {
          icon: LuWallet,
          iconClass: "bg-danger",
          title: `Withdrew ${formatCurrency(item.amount)}`,
          subtitle: item.description,
        };

      case "purchased":
        return {
          icon: LuCircleCheckBig,
          iconClass: "bg-success",
          title: item.title,
          subtitle: item.description,
        };

      default:
        return {
          icon: LuFlag,
          iconClass: "bg-secondary",
          title: "",
          subtitle: "",
        };
    }
  }

  return (
    <>
      <div className="modal-backdrop fade show"></div>

      <div
        className="modal fade show d-block"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">

          <div className="modal-content bg-surface border-0 shadow-lg">

            {/* Header */}

            <div className="modal-header">

                <div className="d-flex justify-content-between align-items-start w-100">

                    <div>

                    <h3 className="fw-bold mb-1">
                        🏆 Achievement Journey
                    </h3>

                    <p className="text-muted mb-0">
                        Every milestone that led to this achievement.
                    </p>

                    </div>

                    <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={onHide}
                    />

                </div>

            </div>

            <div className="modal-body">

              {/* Goal */}

              <div className="text-center mb-5">

                <h2 className="fw-bold">
                  {goal.goal_name}
                </h2>

                <p className="text-muted mb-4">

                    {daysTaken > 1 && (
                        <p className="text-muted mb-4">
                            Completed in{" "}
                            <strong>{daysTaken} days</strong>
                        </p>
                    )}

                </p>

                <div className="progress mx-auto"
                  style={{
                    maxWidth: 500,
                    height: 12,
                  }}
                >

                  <div
                    className="progress-bar bg-success"
                    style={{
                      width: "100%",
                    }}
                  />

                </div>

                <div className="mt-2 fw-semibold text-success">

                  100% Completed • Goal Achieved 🏆

                </div>

              </div>

              {/* Timeline */}

              <h5 className="fw-bold mb-4">
                Your Savings Journey
              </h5>

              <div className="position-relative">

                <div
                  className="position-absolute bg-secondary-subtle"
                  style={{
                    width: 4,
                    left: 17,
                    top: 0,
                    bottom: 0,
                    borderRadius:999,
                  }}
                />

                {orderedTimeline.map((item) => {

                    const event =
                      getEvent(item);

                    const Icon =
                      event.icon;

                    return (
                      <div
                        key={item.id}
                        className="d-flex position-relative mb-4"
                      >

                        <div
                          className={`${event.iconClass} rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0`}
                          style={{
                            width: 36,
                            height: 36,
                            zIndex: 2,
                          }}
                        >

                          <Icon size={18} />

                        </div>

                        <div className="ms-4 flex-grow-1">

                          <div className="border rounded shadow-sm bg-surface-sunken p-3">

                            <div className="d-flex justify-content-between align-items-start">

                              <strong>

                                {event.title}

                              </strong>

                              <small className="text-muted">

                                {new Date(
                                  item.date
                                ).toLocaleDateString()}

                              </small>

                            </div>

                            <div className="text-muted mt-2">

                              {event.subtitle}

                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            {/* Statistics */}

              <hr className="my-5" />

              <h5 className="fw-bold mb-4">
                Statistics
              </h5>

              <div className="row g-3">

                <div className="col-md-3">

                  <div className="border rounded shadow-sm p-3 h-100 bg-surface-sunken">

                    <small className="text-muted">
                      Purchase Value
                    </small>

                    <h4 className="fw-bold mt-2 text-primary">
                      {formatCurrency(goal.target_amount)}
                    </h4>

                  </div>

                </div>

                <div className="col-md-3">

                  <div className="border rounded shadow-sm p-3 h-100 bg-surface-sunken">

                    <small className="text-muted">
                      Total Deposited
                    </small>

                    <h4 className="fw-bold mt-2 text-success">
                      {formatCurrency(totalDeposited)}
                    </h4>

                  </div>

                </div>

                <div className="col-md-3">

                  <div className="border rounded shadow-sm p-3 h-100 bg-surface-sunken">

                    <small className="text-muted">
                      Total Withdrawn
                    </small>

                    <h4 className="fw-bold mt-2 text-danger">
                      {formatCurrency(totalWithdrawn)}
                    </h4>

                  </div>

                </div>

                <div className="col-md-3">

                  <div className="border rounded shadow-sm p-3 h-100 bg-surface-sunken">

                    <small className="text-muted">
                      Days Taken
                    </small>

                    <h4 className="fw-bold mt-2">
                      {daysTaken}
                    </h4>

                  </div>

                </div>

              </div>

              <div className="row g-3 mt-1">

                <div className="col-md-6">

                  <div className="border rounded shadow-sm p-3 bg-surface-sunken h-100">

                    <small className="text-muted">
                      Savings Transactions
                    </small>

                    <h4 className="fw-bold mt-2">
                      {totalTransactions}
                    </h4>

                  </div>

                </div>

                <div className="col-md-6">

                  <div className="border rounded shadow-sm p-3 bg-surface-sunken h-100">

                    <small className="text-muted">
                      Purchase Date
                    </small>

                    <h4 className="fw-bold mt-2">
                      {new Date(goal.purchase_date).toLocaleDateString(
                            "en-IN",
                            {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            }
                        )}
                    </h4>

                  </div>

                </div>

              </div>

              {/* Congratulations - was Bootstrap's .alert-success,
                  same unthemed-in-dark-mode issue fixed in
                  AchievementCard.jsx (see index.css's
                  .token-callout-success for why). */}

              <div className="token-callout-success mt-5 mb-0 p-3">

                <h5 className="fw-semibold mb-2">
                  🎉 Congratulations!
                </h5>

                <p className="mb-0 text-ink">

                  You successfully purchased
                    <strong> {goal.goal_name}</strong>.
                    Keep building great financial habits and
                    achieving your future goals.

                </p>

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="btn btn-primary"
                onClick={onHide}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      </div>

    </>
  );
}

export default AchievementJourneyModal;