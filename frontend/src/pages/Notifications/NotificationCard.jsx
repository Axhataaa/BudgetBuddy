import { LuTrash2 } from "react-icons/lu";
import { formatRelativeDate } from "../../utils/formatRelativeDate";

/**
 * Single notification row. Extracted out of Notifications.jsx (Part 7 -
 * "reusable notification card component") since the row itself grew
 * enough responsibility (click-to-navigate, delete, keyboard handling)
 * to be worth naming and testing on its own, without changing what it
 * actually renders.
 *
 * `meta` is the { icon, badge, label } entry Notifications.jsx already
 * looks up from TYPE_META - passed in rather than re-derived here so
 * there's exactly one place (TYPE_META) that owns that mapping.
 */
export default function NotificationCard({
  notification,
  meta,
  onMarkRead,
  onDelete,
  onNavigate,
}) {
  const Icon = meta.icon;
  const isClickable = Boolean(notification.action_url);
  // Preserves the existing behaviour for notifications with no
  // action_url (older rows created before this field existed, or any
  // future type that genuinely has nowhere to go): unread ones are
  // still clickable purely to mark them read, exactly as before this
  // change; read ones with no action_url aren't clickable at all.
  const isInteractive = isClickable || !notification.is_read;

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
      className="d-flex align-items-center gap-3 py-3 border-bottom transaction-item notification-row px-2"
      style={{
        cursor: isInteractive ? "pointer" : "default",
        backgroundColor: notification.is_read
          ? "transparent"
          : "var(--color-surface-sunken)",
      }}
      onClick={isInteractive ? activate : undefined}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <span className={`insight-icon ${meta.badge}`}>
        <Icon size={16} />
      </span>

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex align-items-center gap-2">
          {!notification.is_read && (
            <span
              className="rounded-circle bg-primary flex-shrink-0"
              style={{ width: 8, height: 8 }}
              aria-label="Unread"
            />
          )}
          {/* Older notifications (created before the title field
              existed) have title="" - fall back to showing the
              message as the headline, exactly as this card behaved
              before titles existed, rather than showing a blank
              line. */}
          <span className={notification.is_read ? "" : "fw-semibold"}>
            {notification.title || notification.message}
          </span>
        </div>

        {notification.title && (
          <p className="text-muted-ink small mb-0 mt-1">
            {notification.message}
          </p>
        )}

        <div className="d-flex align-items-center gap-2 text-muted-ink small mt-2">
          <span className={`badge ${meta.badge}`}>{meta.label}</span>
          <span>{formatRelativeDate(notification.created_at)}</span>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-sm btn-link text-muted-ink p-1 flex-shrink-0"
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
