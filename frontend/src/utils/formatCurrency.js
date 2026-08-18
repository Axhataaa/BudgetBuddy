const CURRENCY_LOCALES = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  JPY: "ja-JP",
  KRW: "ko-KR",
  CNY: "zh-CN",
};

// Currencies whose standard display uses 0 decimal places (ISO 4217 minor
// unit = 0). Everything else in CURRENCY_LOCALES uses 2. Intl.NumberFormat
// already defaults to the correct value per currency on its own, but we
// keep this map so exportReport.js (which can't call Intl for its raw
// numeric CSV/Excel cells) can match the same rounding behavior.
const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW"]);

const formatterCache = new Map();

function getFormatter(currency) {
  const code = CURRENCY_LOCALES[currency] ? currency : "INR";
  if (!formatterCache.has(code)) {
    formatterCache.set(
      code,
      // No explicit minimumFractionDigits/maximumFractionDigits here:
      // Intl.NumberFormat already applies the correct ISO 4217 minor-unit
      // default per currency (2 for INR/USD/EUR/GBP/CNY, 0 for JPY/KRW),
      // so we let it decide instead of hardcoding one value for all.
      new Intl.NumberFormat(CURRENCY_LOCALES[code], {
        style: "currency",
        currency: code,
      })
    );
  }
  return formatterCache.get(code);
}

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

// How many decimal places the given currency (defaults to the active
// display currency) normally displays. Used by exportReport.js, which
// rounds raw numeric CSV/Excel cells itself rather than going through
// Intl.NumberFormat.
export function getCurrencyDecimals(currency = activeCurrency) {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
}

export function getActiveRate() {
  return activeRate;
}

export function convertFromInr(amountInInr) {
  const value = Number(amountInInr);
  if (Number.isNaN(value)) return 0;
  return value * activeRate;
}

export function formatCurrency(amountInInr, currency = activeCurrency, rate) {
  const value = Number(amountInInr);
  const effectiveRate = rate ?? (currency === activeCurrency ? activeRate : 1);
  const formatter = getFormatter(currency);
  if (Number.isNaN(value)) return formatter.format(0);
  return formatter.format(value * effectiveRate);
}
