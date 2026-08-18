import { LuTrash2 } from "react-icons/lu";
import { formatNotificationTimestamp } from "../../utils/formatRelativeDate";
import { getPriorityMeta, getAccentColor } from "../../utils/notificationMeta";

export default function NotificationCard({
  notification,
  meta,
  onMarkRead,
  onDelete,
  onNavigate,
}) {
  const Icon = meta.icon;
  const isClickable = Boolean(notification.action_url);

  const isInteractive = isClickable || !notification.is_read;
  const priorityMeta = getPriorityMeta(notification.priority);
  const accentColor = getAccentColor(notification);

  const activate = () => {
    onMarkRead(notification);
    if (isClickable) onNavigate(notification.action_url);
  };

  const handleKeyDown = (event) => {
    if (!isInteractive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  };

  return (
    <div
      className="d-flex align-items-start gap-3 py-3 border-bottom notification-row-card notification-row px-2"
      style={{
        cursor: isInteractive ? "pointer" : "default",
        backgroundColor: notification.is_read
          ? "transparent"
          : "var(--color-surface-sunken)",
        borderLeft: `3px solid ${accentColor}`,
      }}
      onClick={isInteractive ? activate : undefined}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <span className={`notification-icon ${meta.badge} mt-1`}>
        <Icon size={17} />
      </span>

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2 flex-wrap min-w-0">
            <span className={`badge rounded-pill ${priorityMeta.badge}`}>{priorityMeta.label}</span>
            <span className={notification.is_read ? "" : "fw-semibold"}>
              {notification.title || notification.message}
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 text-muted-ink small flex-shrink-0">
            <span>{formatNotificationTimestamp(notification.created_at)}</span>
            {!notification.is_read && (
              <span
                className="rounded-circle bg-primary flex-shrink-0"
                style={{ width: 8, height: 8 }}
                aria-label="Unread"
              />
            )}
          </div>
        </div>

        {notification.title && (
          <p className="text-muted-ink small mb-0 mt-1">
            {notification.message}
          </p>
        )}
      </div>

      <button
        type="button"
        className="btn btn-sm btn-link text-muted-ink p-1 flex-shrink-0 notification-delete-btn"
        aria-label="Delete notification"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(notification);
        }}
      >
        <LuTrash2 size={16} />
      </button>
    </div>
  );
}
