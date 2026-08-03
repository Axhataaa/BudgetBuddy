import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuBellRing, LuWallet, LuPiggyBank, LuInfo, LuCheck, LuTrash2 } from "react-icons/lu";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import NotificationCard from "./NotificationCard";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "../../services/notificationService";

const PAGE_SIZE = 20;

// Local to this page since it maps Notification.NotificationType
// (budget_alert / savings_goal / general - backend reports/models.py),
// a different set of types than utils/activityMeta.js's Dashboard
// activity types (income / expense / deposit / ...).
const TYPE_META = {
  budget_alert: { icon: LuWallet, badge: "bg-warning-subtle text-warning", label: "Budget Alert" },
  savings_goal: { icon: LuPiggyBank, badge: "bg-success-subtle text-success", label: "Savings Goal" },
  general: { icon: LuInfo, badge: "bg-info-subtle text-info", label: "General" },
};

// Server-side filters - matched against reports/filters.py's
// NotificationFilter (notification_type / is_read), since the list is
// server-paginated and a client-side-only filter would only ever see
// whatever happens to be on the current page.
const FILTERS = [
  { key: "all", label: "All", params: {} },
  { key: "unread", label: "Unread", params: { is_read: "false" } },
  { key: "budget_alert", label: "Budget Alerts", params: { notification_type: "budget_alert" } },
  { key: "savings_goal", label: "Savings Goals", params: { notification_type: "savings_goal" } },
  { key: "general", label: "General", params: { notification_type: "general" } },
];

// Part 5: "Filter by Priority", kept as its own filter row rather than
// folded into FILTERS above - type/read-state and priority are two
// independent dimensions (e.g. "unread AND high priority" is a
// meaningful combination), so this merges into the query params
// alongside activeFilter.params rather than replacing it.
const PRIORITY_FILTERS = [
  { key: "all", label: "Any Priority", params: {} },
  { key: "high", label: "High", params: { priority: "high" } },
  { key: "medium", label: "Medium", params: { priority: "medium" } },
  { key: "low", label: "Low", params: { priority: "low" } },
];

function NotificationSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        // px-2 matches the real row's own px-2 (NotificationCard) so
        // the loading skeleton lines up pixel-for-pixel with loaded
        // content instead of shifting slightly once data arrives.
        <div key={i} className="d-flex align-items-center gap-3 py-3 px-2 border-bottom">
          <span className="placeholder-glow">
            <span className="placeholder rounded-circle" style={{ width: 36, height: 36, display: "inline-block" }} />
          </span>
          <span className="placeholder-glow flex-grow-1">
            <span className="placeholder col-8 d-block mb-2" />
            <span className="placeholder col-4" />
          </span>
        </div>
      ))}
    </>
  );
}

export default function Notifications() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const activeFilter = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const activePriorityFilter =
    PRIORITY_FILTERS.find((f) => f.key === priorityFilter) || PRIORITY_FILTERS[0];

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await listNotifications({
        page,
        ...activeFilter.params,
        ...activePriorityFilter.params,
      });
      setNotifications(data.results || []);
      setCount(data.count || 0);
    } catch {
      showToast("Couldn't load notifications. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, priorityFilter]);

  const handleFilterChange = (key) => {
    if (key === filter) return;
    setFilter(key);
    setPage(1);
  };

  const handlePriorityFilterChange = (key) => {
    if (key === priorityFilter) return;
    setPriorityFilter(key);
    setPage(1);
  };

  const handleNavigate = (actionUrl) => {
    navigate(actionUrl);
  };

  const handleMarkRead = async (notification) => {
    if (notification.is_read) return;
    // Optimistic update - the whole point of "Mark as Read" is that it
    // feels instant; reverts if the request actually fails.
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    );
    try {
      await markNotificationRead(notification.id);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: false } : n))
      );
      showToast("Couldn't mark notification as read.", "error");
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead();
      showToast("All notifications marked as read.", "success");
    } catch {
      setNotifications(previous);
      showToast("Couldn't mark all notifications as read.", "error");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notification) => {
    const previous = notifications;
    const previousCount = count;
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setCount((c) => Math.max(c - 1, 0));
    try {
      await deleteNotification(notification.id);
    } catch {
      setNotifications(previous);
      setCount(previousCount);
      showToast("Couldn't delete notification. Please try again.", "error");
    }
  };

  const handleClearAll = async () => {
    if (count === 0) return;
    const confirmed = window.confirm(
      "Clear all notifications? This cannot be undone."
    );
    if (!confirmed) return;

    setClearingAll(true);
    const previous = notifications;
    const previousCount = count;
    setNotifications([]);
    setCount(0);
    try {
      await clearAllNotifications();
      showToast("All notifications cleared.", "success");
    } catch {
      setNotifications(previous);
      setCount(previousCount);
      showToast("Couldn't clear notifications. Please try again.", "error");
    } finally {
      setClearingAll(false);
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="font-display fs-3 fw-semibold mb-1">Notifications</h1>
          <p className="text-muted-ink mb-0">Budget alerts and savings goal updates.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="secondary"
            icon={LuCheck}
            loading={markingAll}
            disabled={!hasUnread}
            onClick={handleMarkAllRead}
          >
            Mark All as Read
          </Button>

          <Button
            variant="danger"
            icon={LuTrash2}
            loading={clearingAll}
            disabled={count === 0}
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="btn-group" role="group" aria-label="Filter notifications">
          {FILTERS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`btn btn-sm ${filter === opt.key ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => handleFilterChange(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="btn-group" role="group" aria-label="Filter notifications by priority">
          {PRIORITY_FILTERS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`btn btn-sm ${priorityFilter === opt.key ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => handlePriorityFilterChange(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded shadow-token-sm">
        {loading ? (
          <div className="px-4">
            <NotificationSkeleton />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={LuBellRing}
            message={
              filter === "all" && priorityFilter === "all"
                ? "You're all caught up - no notifications yet."
                : "No notifications match this filter."
            }
          />
        ) : (
          <div className="px-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                meta={TYPE_META[notification.notification_type] || TYPE_META.general}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}

        <Pagination count={count} pageSize={PAGE_SIZE} page={page} onPageChange={setPage} />
      </div>
    </div>
  );
}
