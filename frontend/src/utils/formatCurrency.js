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

// The database always stores amounts in INR (Backend API Design Doc -
// no currency field on Expense/Income/Budget/SavingsGoal). The user's
// chosen display currency (Settings > Currency) is applied here as a
// real conversion, not just a relabeled symbol: activeRate is "how
// many units of activeCurrency one INR is worth", fetched from
// utils/exchangeRates.js and kept in sync by PreferencesContext.
// Defaulting to INR/rate=1 means every existing call site
// (Dashboard, Expenses, Income, Budgets, SavingsGoals, Achievements,
// Reports) keeps working unchanged - they still just call
// formatCurrency(amountInINR).
let activeCurrency = "INR";
let activeRate = 1;

export function setActiveCurrency(currency, rate = 1) {
  if (!CURRENCY_LOCALES[currency]) return;
  activeCurrency = currency;
  activeRate = typeof rate === "number" && rate > 0 ? rate : 1;
}

export function getActiveCurrency() {
  return activeCurrency;
}

export function getActiveRate() {
  return activeRate;
}

/**
 * Converts an INR amount to the active currency, without formatting -
 * used where the raw converted number is needed (e.g. CSV export
 * columns) rather than a formatted string.
 */
export function convertFromInr(amountInInr) {
  const value = Number(amountInInr);
  if (Number.isNaN(value)) return 0;
  return value * activeRate;
}

/**
 * Formats an INR amount in the user's active currency, converting it
 * first. Accepts number, numeric string, null, or undefined - API
 * responses send amounts as decimal strings (e.g. "1250.00"), so this
 * coerces rather than requiring every call site to remember to wrap
 * Number(...).
 *
 * `currency`/`rate` are optional explicit overrides; omit both to use
 * the user's active preference (the normal case for every existing
 * call site in the app). Passing an explicit `currency` without a
 * `rate` formats the raw amount unconverted in that currency (rarely
 * needed, kept for flexibility).
 */
export function formatCurrency(amountInInr, currency = activeCurrency, rate) {
  const value = Number(amountInInr);
  const effectiveRate = rate ?? (currency === activeCurrency ? activeRate : 1);
  const formatter = getFormatter(currency);
  if (Number.isNaN(value)) return formatter.format(0);
  return formatter.format(value * effectiveRate);
}
