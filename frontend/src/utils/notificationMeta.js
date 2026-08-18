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

  admin: {
    icon: LuShield,
    badge: "bg-primary-subtle text-primary",
    label: "Admin",
  },

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

export const PRIORITY_META = {
  high: { label: "High", badge: "bg-danger text-white" },
  medium: { label: "Medium", badge: "bg-warning-subtle text-warning" },
  low: { label: "Low", badge: "bg-secondary-subtle text-secondary" },
};

export function getPriorityMeta(priority) {
  return PRIORITY_META[priority] || PRIORITY_META.medium;
}

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

  if (priority === "high") return "var(--color-danger)";
  if (priority === "medium") return "var(--color-warning)";
  return "var(--color-primary)";
}
