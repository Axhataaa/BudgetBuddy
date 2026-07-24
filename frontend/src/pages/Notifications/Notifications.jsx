import { useEffect, useState } from "react";
import { LuBellRing, LuWallet, LuPiggyBank, LuInfo, LuCheck } from "react-icons/lu";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import { formatRelativeDate } from "../../utils/formatRelativeDate";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
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

function NotificationSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="d-flex align-items-start gap-3 py-3 border-bottom">
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

  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await listNotifications({ page });
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
  }, [page]);

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

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="font-display fs-3 fw-semibold mb-1">Notifications</h1>
          <p className="text-muted-ink mb-0">Budget alerts and savings goal updates.</p>
        </div>

        <Button
          variant="secondary"
          icon={LuCheck}
          loading={markingAll}
          disabled={!hasUnread}
          onClick={handleMarkAllRead}
        >
          Mark All as Read
        </Button>
      </div>

      <div className="bg-surface rounded shadow-token-sm">
        {loading ? (
          <div className="px-4">
            <NotificationSkeleton />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={LuBellRing}
            message="You're all caught up - no notifications yet."
          />
        ) : (
          <div className="px-4">
            {notifications.map((notification) => {
              const meta = TYPE_META[notification.notification_type] || TYPE_META.general;
              const Icon = meta.icon;

              return (
                <div
                  key={notification.id}
                  className="d-flex align-items-start gap-3 py-3 border-bottom transaction-item px-2"
                  style={{
                    cursor: notification.is_read ? "default" : "pointer",
                    backgroundColor: notification.is_read ? "transparent" : "var(--color-surface-sunken)",
                  }}
                  onClick={() => handleMarkRead(notification)}
                  role={notification.is_read ? undefined : "button"}
                  tabIndex={notification.is_read ? undefined : 0}
                >
                  <span className={`insight-icon ${meta.badge}`}>
                    <Icon size={16} />
                  </span>

                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={notification.is_read ? "" : "fw-semibold"}>{notification.message}</span>
                      {!notification.is_read && (
                        <span
                          className="rounded-circle bg-primary flex-shrink-0"
                          style={{ width: 8, height: 8 }}
                          aria-label="Unread"
                        />
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted-ink small mt-1">
                      <span className={`badge ${meta.badge}`}>{meta.label}</span>
                      <span>{formatRelativeDate(notification.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination count={count} pageSize={PAGE_SIZE} page={page} onPageChange={setPage} />
      </div>
    </div>
  );
}
