export function formatRelativeDate(dateString) {
  const today = new Date();
  const date = new Date(dateString);

  // Remove time component
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Whether two dates fall on the same calendar day (ignoring time),
// exported for reuse by anything that needs to bucket timestamps by
// day (e.g. Notifications.jsx grouping notifications into
// Today/Yesterday/Earlier sections) without re-deriving this compare
// itself.
export function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatTimeOfDay(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * Human-friendly notification timestamp (Batch A - notification UX
 * enhancements, Section 1 of the FinTech notification spec):
 *   "Just now" / "5 mins ago" / "32 mins ago" / "Today • 5:42 PM" /
 *   "Yesterday • 10:18 AM" / "5 Aug • 7:30 PM"
 *
 * Deliberately a separate function from formatRelativeDate() above
 * rather than a modification of it - formatRelativeDate() is used
 * elsewhere (e.g. the Admin Dashboard's Recent Users table) where a
 * coarser "Today"/"Yesterday"/"3 days ago" label is exactly what's
 * wanted; notifications need the finer-grained, time-of-day-aware
 * format the spec asks for. Keeping them separate means neither call
 * site's existing behaviour changes.
 */
export function formatNotificationTimestamp(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;

  if (isSameCalendarDay(now, date)) {
    return `Today • ${formatTimeOfDay(date)}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameCalendarDay(yesterday, date)) {
    return `Yesterday • ${formatTimeOfDay(date)}`;
  }

  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} • ${formatTimeOfDay(date)}`;
}