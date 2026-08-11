import {
  LuBanknote,
  LuWallet,
  LuGraduationCap,
  LuLaptop,
  LuBuilding2,
  LuGift,
} from "react-icons/lu";

export const INCOME_SOURCES = [
  "Salary",
  "Pocket Money",
  "Scholarship",
  "Freelance",
  "Business",
  "Other",
];

// Visual metadata only (Income redesign, Aug 2026). Unlike Expenses'
// per-category hues, every source shares the same income-subtle tint
// here - "use the existing income/positive color token for amounts
// AND icons" applies to every row on this page, not just the amount
// column, so the icon varies per source but the color doesn't.
const INCOME_BADGE = "bg-success-subtle text-success";

export const INCOME_SOURCE_META = {
  Salary: { icon: LuBanknote, badge: INCOME_BADGE },
  "Pocket Money": { icon: LuWallet, badge: INCOME_BADGE },
  Scholarship: { icon: LuGraduationCap, badge: INCOME_BADGE },
  Freelance: { icon: LuLaptop, badge: INCOME_BADGE },
  Business: { icon: LuBuilding2, badge: INCOME_BADGE },
  Other: { icon: LuGift, badge: INCOME_BADGE },
};

export function getIncomeSourceMeta(source) {
  return INCOME_SOURCE_META[source] || INCOME_SOURCE_META.Other;
}
