// Live INR -> {USD,EUR,GBP,JPY,KRW,CNY} exchange rates.
//
// API DIRECTION (verified, not assumed):
// - Primary:   GET .../v1/currencies/inr.json returns { date, inr: { usd, eur, ... } }
//              where inr.usd is "how many USD equal 1 INR" - i.e. already INR->USD.
//              (The endpoint's base currency is INR; every field under `inr` is
//              that field's amount per 1 INR.) No inversion needed.
// - Secondary: GET open.er-api.com/v6/latest/INR returns { base_code: "INR",
//              rates: { USD, EUR, ... } } where rates.USD is likewise "USD per
//              1 INR" - the `rates` object is always expressed per 1 unit of
//              the requested base, and the base here is INR. No inversion
//              needed either. If either provider's endpoint or base parameter
//              ever changes, this comment is the place to re-verify direction
//              before trusting the numbers below.
//
// PRECISION: rates are stored and used at full API precision. Only the final
// displayed/exported monetary amount is rounded (see formatCurrency.js /
// exportReport.js), never the rate itself.

const CACHE_KEY = "budgetbuddy-exchange-rates";
// Cache schema version. Bump this whenever the stored shape changes so any
// older cached object (e.g. one written before this fix) is treated as
// absent rather than blindly trusted - the user never has to clear
// localStorage by hand for a fix like this to take effect.
const CACHE_SCHEMA_VERSION = 2;

// Cache is a resilience fallback ONLY - it is never used to skip a live
// request. A live fetch is attempted every time refreshExchangeRates() is
// called; the cache is only read when a live source fails for a given
// currency, and is only used on its own (without even trying live) if the
// caller explicitly asks for a synchronous snapshot before the first live
// fetch has completed (see getCachedRatesSync).
const CACHE_MAX_USABLE_AGE_MS = 12 * 60 * 60 * 1000;

// How often to automatically refresh while the app is active. Live currency
// tables on both sources here are refreshed on the order of minutes at most
// (the primary is a daily-published dataset mirrored by a CDN; the secondary
// documents a once-daily update); polling far faster than that just adds
// load without getting fresher numbers, so this is a "keep it current
// without hammering the API" interval, not a claim that the underlying data
// itself changes this often.
export const AUTO_REFRESH_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

export const FALLBACK_RATES = {
  INR: 1,
  USD: 0.0120,
  EUR: 0.0110,
  GBP: 0.0095,
  JPY: 1.6700,
  KRW: 14.8000,
  CNY: 0.0705,
};

const REQUIRED_CODES = Object.keys(FALLBACK_RATES).filter((c) => c !== "INR");

// Returns { values } - `values` has ONLY the keys that came back as a
// genuine positive finite number from this source. Missing/invalid keys are
// simply absent (never coerced to anything, never defaulted to 1).
async function fetchFromPrimarySource() {
  const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/inr.json");
  if (!res.ok) throw new Error(`primary source failed: HTTP ${res.status}`);
  const data = await res.json();
  const rates = data && data.inr;
  if (!rates || typeof rates !== "object") {
    throw new Error("primary source returned an unexpected shape (missing 'inr')");
  }
  const values = {};
  for (const code of REQUIRED_CODES) {
    // API keys are lowercase ISO codes (usd, eur, gbp, jpy, krw, cny), and
    // each value is already "target units per 1 INR" - see file header.
    const raw = rates[code.toLowerCase()];
    const num = typeof raw === "string" ? Number(raw) : raw;
    if (typeof num === "number" && Number.isFinite(num) && num > 0) {
      values[code] = num;
    }
  }
  return { values };
}

async function fetchFromSecondarySource() {
  const res = await fetch("https://open.er-api.com/v6/latest/INR");
  if (!res.ok) throw new Error(`secondary source failed: HTTP ${res.status}`);
  const data = await res.json();
  if (data.result !== "success") throw new Error("secondary source returned an error");
  const rates = data.rates;
  if (!rates || typeof rates !== "object") {
    throw new Error("secondary source returned an unexpected shape (missing 'rates')");
  }
  const values = {};
  for (const code of REQUIRED_CODES) {
    // Already "target units per 1 INR" since the request base is INR -
    // see file header.
    const raw = rates[code];
    const num = typeof raw === "string" ? Number(raw) : raw;
    if (typeof num === "number" && Number.isFinite(num) && num > 0) {
      values[code] = num;
    }
  }
  return { values };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== CACHE_SCHEMA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(rates) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CACHE_SCHEMA_VERSION, rates, fetchedAt: Date.now() })
    );
  } catch {
  }
}

// Fetches BOTH live sources concurrently and merges the result per currency
// - this is never skipped because of cache age. Precedence per currency:
//   1. primary live value
//   2. secondary live value
//   3. last known cached live value for that currency (only if it's not
//      absurdly old - see CACHE_MAX_USABLE_AGE_MS - and only ever as a
//      per-request-failure fallback, not because the cache was "still
//      valid")
//   4. static approximate table (last resort; logged loudly)
// A currency NEVER silently becomes rate 1 - every branch above resolves to
// an explicit, validated positive number.
export async function refreshExchangeRates() {
  const cached = readCache();
  const cacheIsUsable = !!cached && Date.now() - cached.fetchedAt < CACHE_MAX_USABLE_AGE_MS;
  const cachedValues = cacheIsUsable ? cached.rates : {};

  const [primary, secondary] = await Promise.allSettled([
    fetchFromPrimarySource(),
    fetchFromSecondarySource(),
  ]);

  const primaryValues = primary.status === "fulfilled" ? primary.value.values : {};
  const secondaryValues = secondary.status === "fulfilled" ? secondary.value.values : {};

  if (primary.status === "rejected") {
    console.warn("[exchangeRates] primary source failed:", primary.reason?.message || primary.reason);
  }
  if (secondary.status === "rejected") {
    console.warn("[exchangeRates] secondary source failed:", secondary.reason?.message || secondary.reason);
  }

  const rates = { INR: 1 };
  const sources = { INR: "base" };
  let anyLive = false;

  for (const code of REQUIRED_CODES) {
    if (typeof primaryValues[code] === "number") {
      rates[code] = primaryValues[code];
      sources[code] = "primary";
      anyLive = true;
    } else if (typeof secondaryValues[code] === "number") {
      rates[code] = secondaryValues[code];
      sources[code] = "secondary";
      anyLive = true;
    } else if (typeof cachedValues[code] === "number" && cachedValues[code] > 0) {
      rates[code] = cachedValues[code];
      sources[code] = "cache";
      console.warn(`[exchangeRates] ${code}: both live sources failed this refresh, reusing last cached live value.`);
    } else {
      rates[code] = FALLBACK_RATES[code];
      sources[code] = "fallback";
      console.warn(`[exchangeRates] ${code}: no live value available from either source or cache, using static approximate rate.`);
    }
  }

  // Only persist to cache when at least one currency actually got a fresh
  // live value this cycle, so a total outage doesn't overwrite a
  // still-usable cache with a cache-derived copy of itself.
  if (anyLive) {
    writeCache(rates);
  }

  return { rates, sources, fetchedAt: Date.now() };
}

// Synchronous snapshot for initial render only, before the first live fetch
// resolves. Never used to decide whether to skip a live request.
export function getCachedRatesSync() {
  const cached = readCache();
  if (cached && cached.rates) return cached.rates;
  return FALLBACK_RATES;
}
