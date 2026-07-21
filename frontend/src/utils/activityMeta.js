import {
  LuCircleArrowDown,
  LuCircleArrowUp,
  LuWallet,
  LuTarget,
  LuPiggyBank,
  LuAward,
} from "react-icons/lu";

export function getActivityMeta(type) {
  switch (type) {
    case "income":
      return { icon: LuCircleArrowUp, color: "text-income" };
    case "expense":
      return { icon: LuCircleArrowDown, color: "text-expense" };
    case "deposit":
      return { icon: LuPiggyBank, color: "text-success" };
    case "withdrawal":
      return { icon: LuWallet, color: "text-warning" };
    case "goal":
      return { icon: LuTarget, color: "text-primary" };
    case "achievement":
      return { icon: LuAward, color: "text-warning" };
    default:
      return { icon: LuWallet, color: "text-muted" };
  }
}

export function getActivityBadge(type) {
  switch (type) {
    case "income":
      return "bg-success-subtle text-success";
    case "expense":
      return "bg-danger-subtle text-danger";
    case "deposit":
      return "bg-info-subtle text-info";
    case "withdrawal":
      return "bg-warning-subtle text-warning";
    case "goal":
      return "bg-primary-subtle text-primary";
    case "achievement":
      return "bg-warning-subtle text-warning";
    default:
      return "bg-surface-sunken text-ink";
  }
}
