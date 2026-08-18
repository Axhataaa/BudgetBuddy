import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProfile, updateProfile } from "../services/profileService";
import { setActiveCurrency } from "../utils/formatCurrency";
import { refreshExchangeRates, getCachedRatesSync, AUTO_REFRESH_INTERVAL_MS, FALLBACK_RATES } from "../utils/exchangeRates";
import { useAuth } from "../hooks/useAuth";

const PreferencesContext = createContext(null);

const THEME_STORAGE_KEY = "budgetbuddy-theme";
const CURRENCY_STORAGE_KEY = "budgetbuddy-currency";

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

function applyThemeToDocument(theme) {
  const resolved = theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  return resolved;
}

export function PreferencesProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "system");
  const [currency, setCurrencyState] = useState(() => localStorage.getItem(CURRENCY_STORAGE_KEY) || "INR");
  const [resolvedTheme, setResolvedTheme] = useState(() => applyThemeToDocument(theme));
  const [rates, setRates] = useState(() => getCachedRatesSync());
  const [ratesLoading, setRatesLoading] = useState(true);

  // Guards against overlapping fetches (e.g. the auto-refresh interval and a
  // tab-reactivation refresh landing at nearly the same moment) and against
  // setting state after unmount. A single source of truth for "is a rate
  // fetch currently in flight" - never more than one live refresh at once.
  const fetchInFlight = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    setResolvedTheme(applyThemeToDocument(theme));
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(applyThemeToDocument("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Live-first rate refresh: fetches fresh rates from both live sources
  // every time it's called (see exchangeRates.js - the 12h cache there is
  // read only if a live source fails, never used to skip a live request).
  // Called on mount, on a periodic interval, and when the tab becomes
  // visible again after being backgrounded.
  const refreshRates = useCallback(async () => {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    try {
      const { rates: fetched } = await refreshExchangeRates();
      if (mountedRef.current) {
        setRates(fetched);
      }
    } finally {
      fetchInFlight.current = false;
      if (mountedRef.current) setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refreshRates();

    const intervalId = setInterval(refreshRates, AUTO_REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshRates();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshRates]);

  useEffect(() => {
    // Every supported currency is guaranteed a real, validated, positive
    // rate by exchangeRates.js (live > secondary live > cache > static
    // fallback - never silently 1). FALLBACK_RATES[currency] here is only
    // reached if `currency` itself isn't one of the seven supported codes,
    // which setCurrency never allows via the UI.
    const rate = rates[currency] ?? FALLBACK_RATES[currency];
    setActiveCurrency(currency, rate);
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency, rates]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (cancelled) return;
        if (data.theme) {
          const localTheme = localStorage.getItem(THEME_STORAGE_KEY);
          if (localTheme !== null && localTheme !== data.theme) {
            updateProfile({ theme: localTheme }).catch(() => {});
          } else if (localTheme === null) {
            setThemeState(data.theme);
          }
        }
        if (data.currency) setCurrencyState(data.currency);
      })
      .catch(() => {

      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const setTheme = useCallback(
    (next) => {
      setThemeState(next);

      if (isAuthenticated) {
        updateProfile({ theme: next }).catch(() => {});
      }
    },
    [isAuthenticated]
  );
  const setCurrency = useCallback((next) => setCurrencyState(next), []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, currency, setCurrency, rates, ratesLoading }),
    [theme, resolvedTheme, setTheme, currency, setCurrency, rates, ratesLoading]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export default PreferencesContext;
