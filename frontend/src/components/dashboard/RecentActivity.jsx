import { LuInbox } from "react-icons/lu";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatRelativeDate } from "../../utils/formatRelativeDate";
import { getActivityMeta, getActivityBadge } from "../../utils/activityMeta";

function TransactionSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="d-flex align-items-center gap-3 py-2">
          <span className="placeholder-glow">
            <span className="placeholder rounded-circle" style={{ width: 32, height: 32, display: "inline-block" }} />
          </span>
          <span className="placeholder-glow flex-grow-1">
            <span className="placeholder col-6" />
          </span>
          <span className="placeholder-glow">
            <span className="placeholder col-3" />
          </span>
        </div>
      ))}
    </>
  );
}

// Groups the already-fetched activity list by its existing created_at
// field ("Today" / "Yesterday" / "N days ago" / date) - purely a
// presentation grouping, no new data.
function groupByDay(recent) {
  const groups = [];
  let currentLabel = null;
  let currentBucket = null;

  for (const item of recent) {
    const label = formatRelativeDate(item.created_at);
    if (label !== currentLabel) {
      currentLabel = label;
      currentBucket = { label, items: [] };
      groups.push(currentBucket);
    }
    currentBucket.items.push(item);
  }

  return groups;
}

export default function RecentActivity({ recent, loading, periodLabel }) {
  const groups = groupByDay(recent || []);

  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
      <h2 className="font-display fs-6 fw-semibold mb-0">Recent Activity</h2>
      <p className="text-muted-ink small mb-3">Grouped by day, across all your accounts</p>

      {loading ? (
        <TransactionSkeleton />
      ) : (recent || []).length === 0 ? (
        <div className="text-center py-4">
          <LuInbox size={36} className="text-muted-ink mb-2" />
          <p className="text-muted-ink mb-2">No recent activity for {periodLabel}.</p>
          <small className="text-muted">Start by adding an expense or income.</small>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.label}>
            <div className="activity-day-label">{group.label}</div>
            <div className="d-flex flex-column gap-1">
              {group.items.map((item) => {
                const { icon: Icon, color } = getActivityMeta(item.type);
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="transaction-item d-flex align-items-center gap-3 py-2 px-2"
                  >
                    <Icon size={20} className={`${color} flex-shrink-0`} />

                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-medium text-truncate">{item.title}</span>
                        <span className={`badge ${getActivityBadge(item.type)}`}>{item.action}</span>
                      </div>
                      <div className="text-muted-ink small">
                        {item.description && (
                          <>
                            <span>{item.description}</span>
                            <span>{" • "}</span>
                          </>
                        )}
                        <span>
                          {new Date(item.created_at).toLocaleTimeString("en-IN", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className={`fw-semibold font-currency ${color}`}>
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
