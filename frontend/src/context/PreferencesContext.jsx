import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getProfile, updateProfile } from "../services/profileService";
import { setActiveCurrency } from "../utils/formatCurrency";
import { getExchangeRates, getCachedRatesSync } from "../utils/exchangeRates";
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

/**
 * Applies Appearance (theme) and Currency (Settings page) app-wide.
 *
 * Theme takes effect immediately via a `data-theme` attribute on
 * <html> - index.css's dark-theme variable block reacts to it, and
 * since every surface in the app already reads color through CSS
 * custom properties (App design system, index.css), no component
 * needs to know about theming at all.
 *
 * Currency is a real conversion, not a relabeled symbol: amounts are
 * always stored and sent by the backend in INR (no currency field on
 * any financial model), and formatCurrency() converts them using a
 * live INR-based exchange rate (utils/exchangeRates.js) before
 * formatting. Rates are fetched once per session (cached ~12h in
 * localStorage, with a hardcoded fallback if the network and cache
 * are both unavailable) and re-applied whenever the user's currency
 * changes. Because formatCurrency isn't itself reactive, AppShell
 * remounts the current route (key={currency}) whenever currency
 * changes, so already-rendered amounts refresh immediately instead of
 * only on next navigation.
 *
 * Settings was previously the only place theme/currency were edited;
 * the sidebar's quick theme toggle (Aug 2026) is a second entry point
 * that goes through this exact same setTheme, so there is still only
 * one place that actually applies and persists a change - this
 * context just applies whatever is current and caches it in
 * localStorage so there's no flash of the wrong theme/currency on
 * load, then reconciles against the real backend value (source of
 * truth) once the user is authenticated.
 */
export function PreferencesProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "system");
  const [currency, setCurrencyState] = useState(() => localStorage.getItem(CURRENCY_STORAGE_KEY) || "INR");
  const [resolvedTheme, setResolvedTheme] = useState(() => applyThemeToDocument(theme));
  const [rates, setRates] = useState(() => getCachedRatesSync());
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    setResolvedTheme(applyThemeToDocument(theme));
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Live-update if the OS-level preference changes while set to "system".
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(applyThemeToDocument("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Fetch real rates once per session (getExchangeRates itself uses
  // the ~12h localStorage cache, so this is cheap on repeat visits).
  useEffect(() => {
    let cancelled = false;
    getExchangeRates()
      .then((fetched) => {
        if (!cancelled) setRates(fetched);
      })
      .finally(() => {
        if (!cancelled) setRatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const rate = rates[currency] ?? 1;
    setActiveCurrency(currency, rate);
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency, rates]);

  // Reconcile against the real backend value after login - the
  // backend is the source of truth *for a preference it has actually
  // recorded*. But setTheme only started persisting to the backend
  // once the user is authenticated (see setTheme below) - a theme
  // picked on the unauthenticated Landing Page never reaches the
  // backend at all, it only ever lands in localStorage. For a
  // first-time login, the backend still holds nothing but its own
  // default (Profile.theme defaults to "system" - see
  // users/models.py), so blindly pulling data.theme down here would
  // silently discard exactly the pre-login choice this flow is
  // supposed to preserve ("if Landing Page was Dark, Dashboard should
  // open in Dark"). So: if this browser already has its own stored
  // theme (localStorage, not React state - read fresh here rather
  // than closing over `theme` to avoid any staleness), that choice
  // wins and gets pushed to the backend instead; only fall back to
  // the backend's value when this browser has never stored one at
  // all (a real "nothing local to prefer" case, e.g. a brand-new
  // browser/device).
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
        // Not fatal - the app keeps working with the cached/default
        // preference; Settings shows the real value once visited.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const setTheme = useCallback(
    (next) => {
      setThemeState(next);
      // Sidebar redesign (Aug 2026): theme used to only persist to the
      // backend when changed via Settings > Appearance, which called
      // updateProfile itself and passed the result back up. Now that
      // theme can also be changed from the sidebar's quick toggle
      // (present on every authenticated page, not just Settings),
      // persistence moved here instead - so there's exactly one place
      // that both applies AND saves a theme change, and the sidebar
      // toggle and Settings (if it ever adds its own control back)
      // can't drift into two different persistence paths. Unauthenticated
      // callers (the Landing Page's own toggle) simply have nothing to
      // persist to yet - localStorage (below) still keeps the choice
      // for when they do log in. Best-effort/silent: a failed PATCH
      // here shouldn't surface an error for what is, from the user's
      // perspective, an instant, low-stakes UI preference - the local
      // theme still applies immediately either way, exactly like
      // before this change for any unauthenticated caller.
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
