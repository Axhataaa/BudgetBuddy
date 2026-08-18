import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuBellDot,
  LuBellRing,
  LuCheck,
  LuTrash2,
  LuLayoutGrid,
  LuMailWarning,
  LuSlidersHorizontal,
} from "react-icons/lu";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationCard from "./NotificationCard";
import { TYPE_META } from "../../utils/notificationMeta";
import { isSameCalendarDay } from "../../utils/formatRelativeDate";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "../../services/notificationService";

const PAGE_SIZE = 20;

function groupNotificationsByDate(notifications) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = [
    { key: "today", label: "Today", items: [] },
    { key: "yesterday", label: "Yesterday", items: [] },
    { key: "earlier", label: "Earlier", items: [] },
  ];

  for (const notification of notifications) {
    const createdAt = new Date(notification.created_at);
    if (isSameCalendarDay(now, createdAt)) {
      groups[0].items.push(notification);
    } else if (isSameCalendarDay(yesterday, createdAt)) {
      groups[1].items.push(notification);
    } else {
      groups[2].items.push(notification);
    }
  }

  return groups.filter((group) => group.items.length > 0);
}

const FILTERS = [
  { key: "all", label: "All", icon: LuLayoutGrid, params: {} },
  { key: "unread", label: "Unread", icon: LuMailWarning, params: { is_read: "false" } },
  { key: "expense", label: "Expenses", icon: TYPE_META.expense.icon, params: { notification_type: "expense" } },
  { key: "income", label: "Income", icon: TYPE_META.income.icon, params: { notification_type: "income" } },
  {
    key: "budget",
    label: "Budgets",
    icon: TYPE_META.budget.icon,
    params: { notification_type: "budget,budget_warning,budget_exceeded,budget_alert" },
  },
  {
    key: "savings_goal",
    label: "Savings Goals",
    icon: TYPE_META.savings_goal.icon,
    params: { notification_type: "savings_goal" },
  },
  {
    key: "achievement",
    label: "Achievements",
    icon: TYPE_META.achievement.icon,
    params: { notification_type: "achievement" },
  },
  {
    key: "monthly_report",
    label: "Reports",
    icon: TYPE_META.monthly_report.icon,
    params: { notification_type: "monthly_report" },
  },
  { key: "reminder", label: "Reminders", icon: TYPE_META.reminder.icon, params: { notification_type: "reminder" } },
];

const PRIORITY_FILTERS = [
  { key: "all", label: "Any Priority", icon: LuSlidersHorizontal, params: {} },
  { key: "high", label: "High", dotColor: "var(--color-danger)", params: { priority: "high" } },
  { key: "medium", label: "Medium", dotColor: "var(--color-warning)", params: { priority: "medium" } },
  { key: "low", label: "Low", dotColor: "var(--color-income)", params: { priority: "low" } },
];

function NotificationSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="d-flex align-items-center gap-3 py-3 px-2 border-bottom">
          <span className="placeholder-glow">
            <span className="placeholder rounded-circle" style={{ width: 40, height: 40, display: "inline-block" }} />
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
  const { refreshUnreadCount } = useNotifications();

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
      refreshUnreadCount();
    } catch {
      showToast("Couldn't load notifications. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
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
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    );
    try {
      await markNotificationRead(notification.id);
      refreshUnreadCount();
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
      refreshUnreadCount();
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
      refreshUnreadCount();
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
      refreshUnreadCount();
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
      <div className="bg-surface rounded shadow-token-sm p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <span className="notification-header-icon">
            <LuBellDot size={22} />
          </span>
          <div>
            <h1 className="font-display fs-3 fw-semibold mb-1">Notifications</h1>
            <p className="text-muted-ink mb-0">Stay updated on your budgets, income, and savings activity.</p>
          </div>
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

      <div className="d-flex flex-column gap-3 mb-4">
        <div className="d-flex flex-wrap gap-2" role="group" aria-label="Filter notifications">
          {FILTERS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`notification-chip ${filter === opt.key ? "active" : ""}`}
              onClick={() => handleFilterChange(opt.key)}
            >
              <opt.icon size={14} />
              {opt.label}
            </button>
          ))}
        </div>

        <div
          className="notification-priority-track"
          role="group"
          aria-label="Filter notifications by priority"
        >
          {PRIORITY_FILTERS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`notification-priority-segment ${priorityFilter === opt.key ? "active" : ""}`}
              onClick={() => handlePriorityFilterChange(opt.key)}
            >
              {opt.dotColor ? (
                <span className="notification-priority-dot" style={{ backgroundColor: opt.dotColor }} />
              ) : (
                <opt.icon size={14} />
              )}
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
          <div className="px-4 py-2">
            {groupNotificationsByDate(notifications).map((group) => (
              <div key={group.key}>
                <div className="text-muted-ink small fw-semibold text-uppercase pt-3 pb-2" style={{ letterSpacing: "0.04em" }}>
                  {group.label}
                </div>
                {group.items.map((notification) => (
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
            ))}
          </div>
        )}

        <Pagination count={count} pageSize={PAGE_SIZE} page={page} onPageChange={setPage} />
      </div>
    </div>
  );
}
