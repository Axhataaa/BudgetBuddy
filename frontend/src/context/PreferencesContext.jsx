import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getProfile } from "../services/profileService";
import { setActiveCurrency } from "../utils/formatCurrency";
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
 * Currency is applied through formatCurrency's module-level active
 * currency (utils/formatCurrency.js) instead of threading a currency
 * prop through every page that calls formatCurrency(amount) - every
 * existing call site (Dashboard, Expenses, Income, Budgets,
 * SavingsGoals, ...) keeps working unchanged. Because that function
 * isn't itself reactive, AppShell remounts the current route
 * (key={currency}) whenever currency changes, so already-rendered
 * amounts refresh immediately instead of only on next navigation.
 *
 * Settings remains the only place these are edited - this context
 * just applies whatever is current and caches it in localStorage so
 * there's no flash of the wrong theme/currency on load, then
 * reconciles against the real backend value (source of truth) once
 * the user is authenticated.
 */
export function PreferencesProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "system");
  const [currency, setCurrencyState] = useState(() => localStorage.getItem(CURRENCY_STORAGE_KEY) || "INR");
  const [resolvedTheme, setResolvedTheme] = useState(() => applyThemeToDocument(theme));

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

  useEffect(() => {
    setActiveCurrency(currency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency]);

  // Reconcile against the real backend value after login - the
  // backend is the source of truth; localStorage is only a pre-fetch
  // cache to avoid a flash of the wrong theme/currency.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (cancelled) return;
        if (data.theme) setThemeState(data.theme);
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

  const setTheme = useCallback((next) => setThemeState(next), []);
  const setCurrency = useCallback((next) => setCurrencyState(next), []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, currency, setCurrency }),
    [theme, resolvedTheme, setTheme, currency, setCurrency]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export default PreferencesContext;
