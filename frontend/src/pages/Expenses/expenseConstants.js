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

// Mirrors expenses/models.py CATEGORY_CHOICES / PAYMENT_METHODS exactly.
// Kept here (not hardcoded inline in the page) so if the backend adds a
// category later, this is the one place the frontend needs updating.
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

// Visual metadata only (Expenses redesign, Aug 2026) - icon + a
// Bootstrap "-subtle" badge pair per category, same convention
// utils/notificationMeta.js already established for notification
// types. Deliberately avoids "success"/text-success: this app's :root
// aliases --bs-success straight to --color-income (see index.css),
// so using it for an unrelated expense category would visually borrow
// the app's one "money coming in" color for something that isn't
// income - every other subtle variant here is either genuinely
// unclaimed (info, secondary) or a reasonable real-world convention
// (Healthcare -> danger/red, a common medical-cross association).
// "accent" uses .badge-accent-subtle (index.css) - a new subtle-badge
// class built from the existing --color-accent token, not a new color.
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
