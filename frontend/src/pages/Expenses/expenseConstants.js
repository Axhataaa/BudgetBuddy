import {
  LuUtensils,
  LuPlane,
  LuShoppingBag,
  LuGraduationCap,
  LuGamepad2,
  LuHeartPulse,
  LuReceipt,
  LuEllipsis,
} from "react-icons/lu";

export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Education",
  "Entertainment",
  "Healthcare",
  "Bills",
  "Miscellaneous",
];

export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer"];

export const EXPENSE_CATEGORY_META = {
  Food: { icon: LuUtensils, badge: "bg-warning-subtle text-warning" },
  Travel: { icon: LuPlane, badge: "bg-info-subtle text-info" },
  Shopping: { icon: LuShoppingBag, badge: "bg-primary-subtle text-primary" },
  Education: { icon: LuGraduationCap, badge: "bg-danger-subtle text-danger" },
  Entertainment: { icon: LuGamepad2, badge: "badge-accent-subtle" },
  Healthcare: { icon: LuHeartPulse, badge: "bg-danger-subtle text-danger" },
  Bills: { icon: LuReceipt, badge: "bg-secondary-subtle text-secondary" },
  Miscellaneous: { icon: LuEllipsis, badge: "bg-surface-sunken text-ink" },
};

export function getExpenseCategoryMeta(category) {
  return EXPENSE_CATEGORY_META[category] || EXPENSE_CATEGORY_META.Miscellaneous;
}
