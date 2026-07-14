const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a number as Indian-grouped rupees: ₹1,25,000.00
 *
 * Uses Intl.NumberFormat's built-in "en-IN" locale rather than a
 * hand-rolled regex for lakh/crore grouping - verified against the
 * exact examples in the Design System (₹850.00, ₹13,000.00,
 * ₹1,25,000.00, ₹12,50,000.00, ₹1,23,45,678.90) before adoption.
 *
 * Accepts number, numeric string, null, or undefined - API responses
 * send amounts as decimal strings (e.g. "1250.00"), so this coerces
 * rather than requiring every call site to remember to wrap Number(...).
 */
export function formatCurrency(amount) {
  const value = Number(amount);
  if (Number.isNaN(value)) return inrFormatter.format(0);
  return inrFormatter.format(value);
}
