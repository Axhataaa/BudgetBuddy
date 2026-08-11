import { useState } from "react";
import {
  LuPiggyBank,
  LuWallet,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";

const VISIBLE_COUNT = 4;

function TransactionRow({ transaction }) {
  const deposit = transaction.transaction_type === "deposit";

  return (
    <div className="d-flex justify-content-between align-items-center border-bottom pb-2">

      <div className="d-flex align-items-center">

        {deposit ? (
          <LuPiggyBank
            className="text-income me-2"
            size={20}
          />
        ) : (
          <LuWallet
            className="text-expense me-2"
            size={20}
          />
        )}

        <div>

          <div className="fw-medium">
            {transaction.note || "No note"}
          </div>

          <small className="text-muted-ink">
            {new Date(
              transaction.created_at
            ).toLocaleDateString()}
          </small>

        </div>

      </div>

      <span
        className={`fw-semibold font-currency ${
          deposit
            ? "text-income"
            : "text-expense"
        }`}
      >
        {deposit ? "+" : "-"}
        {formatCurrency(transaction.transaction_amount)}
      </span>

    </div>
  );
}

/**
 * Shows the first VISIBLE_COUNT transactions plainly; anything beyond
 * that renders inside a grid-template-rows collapsible wrapper (0fr
 * -> 1fr), which animates smoothly to/from its real content height
 * without measuring it in JS - unlike animating max-height to a fixed
 * guess, this works correctly regardless of how many extra rows there
 * are. Only mounted at all when there's actually an overflow beyond
 * VISIBLE_COUNT, so a goal with 4 or fewer activities looks exactly
 * as before (no link, no wrapper).
 */
function TransactionHistory({
  transactions = [],
}) {
  const [expanded, setExpanded] = useState(false);

  if (transactions.length === 0) {
    return (
      <div className="text-muted-ink small mt-3">
        No transactions yet.
      </div>
    );
  }

  const hasOverflow = transactions.length > VISIBLE_COUNT;
  const visible = hasOverflow ? transactions.slice(0, VISIBLE_COUNT) : transactions;
  const rest = hasOverflow ? transactions.slice(VISIBLE_COUNT) : [];

  return (
    <div className="mt-3">

      {/* Small uppercase label (same convention Notifications' day
          groups and Settings' "Email categories" use for a section
          label that belongs to the card it's in, rather than an h6
          that reads as its own separate block) - "integrated instead
          of a separate block" per the redesign brief. */}
      <div className="text-muted-ink small fw-semibold text-uppercase mb-2" style={{ letterSpacing: "0.04em" }}>
        Recent Activity
      </div>

      <div className="d-flex flex-column gap-3">
        {visible.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </div>

      {hasOverflow && (
        <>
          <div className="activity-collapse" data-expanded={expanded}>
            <div className="activity-collapse-inner">
              <div className="d-flex flex-column gap-3 pt-3">
                {rest.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none px-0 mt-2 d-inline-flex align-items-center gap-1"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? (
              <>
                Show Less
                <LuChevronUp size={14} />
              </>
            ) : (
              <>
                {`View All Activity (${transactions.length})`}
                <LuChevronDown size={14} />
              </>
            )}
          </button>
        </>
      )}

    </div>
  );
}

export default TransactionHistory;
