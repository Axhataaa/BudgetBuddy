import { LuTrash2 } from "react-icons/lu";
import { formatNotificationTimestamp } from "../../utils/formatRelativeDate";
import { getPriorityMeta, getAccentColor } from "../../utils/notificationMeta";

/**
 * Single notification row. Extracted out of Notifications.jsx (Part 7 -
 * "reusable notification card component") since the row itself grew
 * enough responsibility (click-to-navigate, delete, keyboard handling)
 * to be worth naming and testing on its own, without changing what it
 * actually renders.
 *
 * `meta` is the { icon, badge, label } entry Notifications.jsx looks
 * up from utils/notificationMeta.js's TYPE_META - passed in rather
 * than re-derived here so there's exactly one place that owns that
 * mapping. Priority badge and accent color (Batch A - notification UX
 * enhancements) are derived locally via the same module's
 * getPriorityMeta()/getAccentColor(), since those only need the
 * notification itself, not anything the parent list already computed.
 *
 * Visual redesign (Aug 2026, UI-only): the priority badge now sits
 * next to the title and the timestamp/unread dot moved to the row's
 * top-right, matching a standard notification-feed layout. The
 * separate "type" text badge that used to sit in a meta row below the
 * message was dropped - the type is still fully conveyed by this same
 * icon (color + shape, from `meta`) and by the left accent border
 * below, so nothing is lost, it's just no longer repeated as a second
 * text label. Every other prop, handler and piece of notification
 * data is unchanged.
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
            {/* Older notifications (created before the title field
                existed) have title="" - fall back to showing the
                message as the headline, exactly as this card behaved
                before titles existed, rather than showing a blank
                line. */}
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
