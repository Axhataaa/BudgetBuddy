import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { AuthProvider } from "../../context/AuthContext";
import { PreferencesProvider } from "../../context/PreferencesContext";
import { NotificationsProvider } from "../../context/NotificationsContext";
import { ToastProvider } from "../../components/ui/Toast";
import Dashboard from "./Dashboard";
import { getDashboardSummary, getRecentActivity } from "../../services/dashboardService";
import { listSavingsGoals } from "../../services/savingsGoalService";
import { getReportSummary } from "../../services/reportService";
import { getLastNMonthsRange } from "../../utils/dateRanges";

vi.mock("../../services/dashboardService", () => ({
  getDashboardSummary: vi.fn(),
  getRecentActivity: vi.fn(),
}));
vi.mock("../../services/savingsGoalService", () => ({
  listSavingsGoals: vi.fn(),
}));
vi.mock("../../services/reportService", () => ({
  getReportSummary: vi.fn(),
}));
// Dashboard renders TrendChart, which reads currency/theme preferences, so the
// full provider tree (including Preferences/Notifications) is needed here —
// unlike the simpler pages, Dashboard actually depends on them.
vi.mock("../../services/profileService", () => ({
  getProfile: vi.fn().mockResolvedValue({ currency: "INR" }),
  updateProfile: vi.fn(),
}));
vi.mock("../../services/notificationService", () => ({
  listNotifications: vi.fn().mockResolvedValue({ count: 0, results: [] }),
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <NotificationsProvider>
          <PreferencesProvider>
            <ToastProvider>
              <Dashboard />
            </ToastProvider>
          </PreferencesProvider>
        </NotificationsProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

const emptySummary = {
  total_income: 0,
  total_expenses: 0,
  budget_utilization: [],
  expense_by_category: [],
};

const populatedSummary = {
  total_income: 5000,
  total_expenses: 3200,
  budget_utilization: [{ category: "Food", limit: 1000, spent: 400 }],
  expense_by_category: [{ category: "Food", amount: 400 }],
};

function mockServicesResolve({ summary = emptySummary, recent = [], goals = [], trend = [] } = {}) {
  getDashboardSummary.mockResolvedValue(summary);
  getRecentActivity.mockResolvedValue(recent);
  listSavingsGoals.mockResolvedValue({ results: goals });
  getReportSummary.mockResolvedValue({ trend });
}

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the page header immediately while data is still loading", () => {
    // Never-resolving promises keep the component in its loading state.
    getDashboardSummary.mockReturnValue(new Promise(() => {}));
    getRecentActivity.mockReturnValue(new Promise(() => {}));
    listSavingsGoals.mockReturnValue(new Promise(() => {}));
    getReportSummary.mockReturnValue(new Promise(() => {}));

    renderDashboard();
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("renders summary data once the API calls resolve", async () => {
    mockServicesResolve({ summary: populatedSummary });
    renderDashboard();

    await waitFor(() => expect(getDashboardSummary).toHaveBeenCalled());
    // Total income appears (formatted) once loading finishes.
    await waitFor(() => {
      expect(screen.queryByText(/5,000|5000/)).toBeInTheDocument();
    });
  });

  it("shows an error toast and does not crash when the dashboard API fails", async () => {
    getDashboardSummary.mockRejectedValue(new Error("Network Error"));
    getRecentActivity.mockRejectedValue(new Error("Network Error"));
    listSavingsGoals.mockResolvedValue({ results: [] });
    getReportSummary.mockResolvedValue({ trend: [] });

    renderDashboard();

    expect(await screen.findByText(/couldn't load dashboard data/i)).toBeInTheDocument();
    // The header still renders — the app degrades gracefully rather than crashing.
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("handles an empty-data period without crashing", async () => {
    mockServicesResolve({ summary: emptySummary });
    renderDashboard();

    await waitFor(() => expect(getDashboardSummary).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  // Regression test for the stale-session bug: when the axios interceptor
  // has already forced a logout (expired access token + invalid/missing
  // refresh token), the rejected error is tagged `isSessionExpired`.
  // Dashboard must NOT show its own error toast in that case — the
  // interceptor already redirects the user back to the public landing page,
  // and since ToastProvider lives above the router, a toast raised here
  // would otherwise survive that redirect and appear on the landing page.
  it("does not show an error toast when the failure is a session-expiry (forced logout)", async () => {
    const sessionExpiredError = new Error("Request failed with status code 401");
    sessionExpiredError.isSessionExpired = true;

    getDashboardSummary.mockRejectedValue(sessionExpiredError);
    getRecentActivity.mockRejectedValue(sessionExpiredError);
    listSavingsGoals.mockResolvedValue({ results: [] });
    getReportSummary.mockResolvedValue({ trend: [] });

    renderDashboard();

    await waitFor(() => expect(getDashboardSummary).toHaveBeenCalled());
    // Give any (incorrect) toast a chance to appear before asserting absence.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText(/couldn't load dashboard data/i)).not.toBeInTheDocument();
    // The page itself should still render cleanly rather than crash.
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  // Regression tests for the "Last 6 Months chart doesn't follow the
  // selected Dashboard period" bug: the chart's date range must be anchored
  // to the currently selected month/year, and must refetch whenever that
  // selection changes.
  describe("Last 6 Months chart period wiring", () => {
    it("fetches the trend anchored to the currently selected Dashboard period on initial load", async () => {
      mockServicesResolve();
      renderDashboard();

      await waitFor(() => expect(getReportSummary).toHaveBeenCalled());

      const now = new Date();
      const { date_from, date_to } = getLastNMonthsRange(6, now.getMonth() + 1, now.getFullYear());
      expect(getReportSummary).toHaveBeenCalledWith({ date_from, date_to });
    });

    it("refetches the trend with a shifted 6-month window when the Dashboard period changes", async () => {
      mockServicesResolve();
      renderDashboard();

      await waitFor(() => expect(getReportSummary).toHaveBeenCalledTimes(1));

      fireEvent.click(screen.getByRole("button", { name: /previous month/i }));

      await waitFor(() => expect(getReportSummary).toHaveBeenCalledTimes(2));

      const now = new Date();
      const prevPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonth = prevPeriod.getMonth() + 1;
      const prevYear = prevPeriod.getFullYear();

      const { date_from, date_to } = getLastNMonthsRange(6, prevMonth, prevYear);
      expect(getReportSummary).toHaveBeenLastCalledWith({ date_from, date_to });

      // The main monthly statistics fetch must keep tracking the selected
      // period too — this fix only changes how the trend window is
      // computed, not the existing per-month summary behavior.
      expect(getDashboardSummary).toHaveBeenLastCalledWith({ month: prevMonth, year: prevYear });
    });
  });
});
