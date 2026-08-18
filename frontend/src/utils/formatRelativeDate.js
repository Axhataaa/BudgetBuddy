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