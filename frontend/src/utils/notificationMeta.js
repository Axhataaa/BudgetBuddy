import {
  LuWallet,
  LuCoins,
  LuTriangleAlert,
  LuFlag,
  LuTrophy,
  LuChartColumn,
  LuClock,
  LuShield,
  LuInfo,
} from "react-icons/lu";

/**
 * Icon + badge class + label per Notification.NotificationType
 * (backend notifications/models.py). Extracted out of
 * Notifications.jsx (where it used to live inline) into its own
 * module for the same reason utils/activityMeta.js already exists as
 * a standalone file for the Dashboard's activity feed - it's a single
 * source of truth that both Notifications.jsx and NotificationCard.jsx
 * import, so a new NotificationType only ever needs a new entry here,
 * never a change to either component.
 *
 * Deliberately keyed by notification_type (a real backend field), not
 * derived from each notification's title text - title strings are
 * free-form and not a reliable, forward-compatible way to categorize
 * a notification.
 *
 * Batch B added the granular types below (expense, income, budget,
 * budget_warning, budget_exceeded, achievement, monthly_report,
 * reminder, admin) once notifications/models.py actually defined
 * them, and every create_notification() call site was updated to use
 * the specific one instead of the old catch-all budget_alert/general.
 * budget_alert is kept here (not removed) purely so any pre-Batch-B
 * row still resolves to a real entry instead of falling through to
 * the general default.
 */
export const TYPE_META = {
  expense: {
    icon: LuWallet,
    badge: "bg-secondary-subtle text-secondary",
    label: "Expense",
  },
  income: {
    icon: LuCoins,
    badge: "bg-success-subtle text-success",
    label: "Income",
  },
  // Routine budget lifecycle (created/updated) - distinct from the
  // two threshold-alert types below, same neutral/info treatment
  // "general" used to have, since this is that same kind of routine,
  // non-urgent update.
  budget: {
    icon: LuWallet,
    badge: "bg-info-subtle text-info",
    label: "Budget",
  },
  budget_warning: {
    icon: LuTriangleAlert,
    badge: "bg-warning-subtle text-warning",
    label: "Budget Warning",
  },
  budget_exceeded: {
    icon: LuTriangleAlert,
    badge: "bg-danger-subtle text-danger",
    label: "Budget Exceeded",
  },
  // Flag matches Sidebar.jsx's own icon for the Savings Goals nav
  // item, so a savings notification's icon is the same one the user
  // already associates with that section.
  savings_goal: {
    icon: LuFlag,
    badge: "bg-success-subtle text-success",
    label: "Savings Goal",
  },
  achievement: {
    icon: LuTrophy,
    badge: "bg-success-subtle text-success",
    label: "Achievement",
  },
  monthly_report: {
    icon: LuChartColumn,
    badge: "bg-info-subtle text-info",
    label: "Monthly Report",
  },
  reminder: {
    icon: LuClock,
    badge: "bg-secondary-subtle text-secondary",
    label: "Reminder",
  },
  // Not produced by any call site yet (see models.py's own comment on
  // this choice) - meta defined now so the moment something does
  // create one, it renders correctly with no further changes here.
  admin: {
    icon: LuShield,
    badge: "bg-primary-subtle text-primary",
    label: "Admin",
  },

  // --- Legacy / catch-all -------------------------------------------
  // Pre-Batch-B rows only; no active call site produces this anymore.
  budget_alert: {
    icon: LuTriangleAlert,
    badge: "bg-warning-subtle text-warning",
    label: "Budget Alert",
  },
  general: {
    icon: LuInfo,
    badge: "bg-info-subtle text-info",
    label: "General",
  },
};

export function getTypeMeta(notificationType) {
  return TYPE_META[notificationType] || TYPE_META.general;
}

/**
 * Priority badge (Section 2 of the notification UX spec): HIGH -> red,
 * MEDIUM -> orange, LOW -> blue/grey.
 *
 * HIGH is deliberately solid (bg-danger, not bg-danger-subtle) while
 * MEDIUM/LOW stay subtle - an urgent notification (Budget Exceeded)
 * should visually outrank a routine one at a glance, not just differ
 * in hue. MEDIUM and LOW reuse the same "-subtle" Bootstrap badge
 * classes every other badge in this app already uses, so only HIGH's
 * treatment is new.
 */
export const PRIORITY_META = {
  high: { label: "High", badge: "bg-danger text-white" },
  medium: { label: "Medium", badge: "bg-warning-subtle text-warning" },
  low: { label: "Low", badge: "bg-secondary-subtle text-secondary" },
};

export function getPriorityMeta(priority) {
  return PRIORITY_META[priority] || PRIORITY_META.medium;
}

/**
 * Subtle left-border accent color (Section 4 - "use only subtle
 * borders, icon colors, badges, or small accent strips").
 *
 * Now keyed directly off notification_type, since Batch B's granular
 * types make the real category available - this replaces Batch A's
 * interim (notification_type, priority) heuristic, which existed only
 * because budget_alert/general were too coarse to tell "Budget
 * Exceeded" apart from "Goal Completed" by type alone. Only this
 * function changed; NotificationCard.jsx, which calls it, did not.
 */
export function getAccentColor({ notification_type, priority }) {
  switch (notification_type) {
    case "income":
    case "savings_goal":
    case "achievement":
      return "var(--color-income)";
    case "budget_warning":
      return "var(--color-warning)";
    case "budget_exceeded":
      return "var(--color-danger)";
    case "monthly_report":
      return "var(--color-primary)";
    default:
      break;
  }

  // expense / budget / reminder / admin / legacy budget_alert /
  // general: none of these has an inherent success/warning/danger
  // sentiment of its own, so fall back to priority - the same
  // reasonable default Batch A used everywhere before real
  // categories existed.
  if (priority === "high") return "var(--color-danger)";
  if (priority === "medium") return "var(--color-warning)";
  return "var(--color-primary)";
}
