const CACHE_KEY = "budgetbuddy-exchange-rates";
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours - "cache reasonably"

// Last-resort fallback if both the network and localStorage cache are
// unavailable (e.g. first-ever load, offline). These are approximate
// INR conversion rates and are clearly a fallback, not a live quote -
// used only when nothing better is available.
const FALLBACK_RATES = {
  INR: 1,
  USD: 0.0120,
  EUR: 0.0110,
  GBP: 0.0095,
};

/**
 * Two free, keyless, CORS-enabled sources, tried in order. Both
 * publish rates for every ISO currency with INR as a valid base, so
 * either response is normalized to the same { INR, USD, EUR, GBP }
 * shape this app needs.
 */
async function fetchFromPrimarySource() {
  const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/inr.json");
  if (!res.ok) throw new Error("primary source failed");
  const data = await res.json();
  const rates = data.inr;
  return {
    INR: 1,
    USD: rates.usd,
    EUR: rates.eur,
    GBP: rates.gbp,
  };
}

async function fetchFromSecondarySource() {
  const res = await fetch("https://open.er-api.com/v6/latest/INR");
  if (!res.ok) throw new Error("secondary source failed");
  const data = await res.json();
  if (data.result !== "success") throw new Error("secondary source returned an error");
  return {
    INR: 1,
    USD: data.rates.USD,
    EUR: data.rates.EUR,
    GBP: data.rates.GBP,
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(rates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }));
  } catch {
    // Storage full or unavailable - not fatal, just means no cache
    // for next load; the in-memory rates for this session still work.
  }
}

/**
 * Returns { INR: 1, USD: x, EUR: x, GBP: x } - INR-per-unit-of-that-
 * currency isn't how these are expressed; each value is "how many
 * units of that currency one INR is worth", i.e. the multiplier
 * formatCurrency applies directly to an INR amount.
 *
 * Order of preference: fresh cache (< 12h old) -> live fetch (primary,
 * then secondary) -> stale cache (better than nothing) -> hardcoded
 * fallback. Every path returns a usable rate table; this never throws.
 */
export async function getExchangeRates() {
  const cached = readCache();
  if (cached && Date.now() - cached.fetchedAt < CACHE_MAX_AGE_MS) {
    return cached.rates;
  }

  try {
    const rates = await fetchFromPrimarySource();
    writeCache(rates);
    return rates;
  } catch {
    // fall through to secondary
  }

  try {
    const rates = await fetchFromSecondarySource();
    writeCache(rates);
    return rates;
  } catch {
    // fall through to stale cache / hardcoded fallback
  }

  if (cached) return cached.rates;

  return FALLBACK_RATES;
}

/**
 * Synchronous best-guess for the very first render, before the async
 * fetch above resolves - stale cache if any, otherwise the hardcoded
 * fallback. Never blocks, never throws.
 */
export function getCachedRatesSync() {
  const cached = readCache();
  return cached?.rates || FALLBACK_RATES;
}
