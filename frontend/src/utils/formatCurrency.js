// One Intl.NumberFormat per currency, built lazily and cached - avoids
// re-constructing a formatter on every call while still supporting
// every currency in Profile.Currency (backend users/models.py).
const CURRENCY_LOCALES = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
};

const formatterCache = new Map();

function getFormatter(currency) {
  const code = CURRENCY_LOCALES[currency] ? currency : "INR";
  if (!formatterCache.has(code)) {
    formatterCache.set(
      code,
      new Intl.NumberFormat(CURRENCY_LOCALES[code], {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  return formatterCache.get(code);
}

// The user's chosen currency (Settings > Currency), applied here as a
// module-level default rather than threading a `currency` prop through
// every page that already calls formatCurrency(amount) - Dashboard,
// Expenses, Income, Budgets, SavingsGoals and their child components
// all keep their existing single-argument calls unchanged.
// PreferencesContext is the only thing that calls setActiveCurrency,
// whenever the user's saved currency loads or changes.
let activeCurrency = "INR";

export function setActiveCurrency(currency) {
  if (CURRENCY_LOCALES[currency]) activeCurrency = currency;
}

export function getActiveCurrency() {
  return activeCurrency;
}

/**
 * Formats a number using the active currency, Indian-grouped for INR
 * (₹1,25,000.00) and standard grouping for others ($1,250,000.00).
 *
 * Accepts number, numeric string, null, or undefined - API responses
 * send amounts as decimal strings (e.g. "1250.00"), so this coerces
 * rather than requiring every call site to remember to wrap Number(...).
 *
 * `currency` is an optional explicit override; omit it to use the
 * user's active preference (the normal case for every existing call
 * site in the app).
 */
export function formatCurrency(amount, currency = activeCurrency) {
  const value = Number(amount);
  const formatter = getFormatter(currency);
  if (Number.isNaN(value)) return formatter.format(0);
  return formatter.format(value);
}
