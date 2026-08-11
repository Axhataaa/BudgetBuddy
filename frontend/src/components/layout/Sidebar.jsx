import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LuAward,
  LuBellRing,
  LuChartColumn,
  LuFlag,
  LuLayoutDashboard,
  LuLogOut,
  LuMoon,
  LuPiggyBank,
  LuSettings,
  LuSun,
  LuTarget,
  LuWallet,
  LuX,
} from "react-icons/lu";
import ConfirmDialog from "../ui/ConfirmDialog";
import { usePreferences } from "../../hooks/usePreferences";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar({ open = false, onClose }) {
  const { resolvedTheme, setTheme } = usePreferences();
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navClass = ({ isActive }) =>
    `d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${
      isActive
        ? "bg-primary text-white"
        : "text-muted-ink"
    }`;

  // Same useAuth().logout() Settings > Log Out already uses (token
  // clearing + the auth state flip that ProtectedRoute reacts to by
  // redirecting to "/") - not a second logout implementation, just a
  // second place to trigger the one that already exists.
  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
    }
  };

  return (
    <aside
      className={`app-sidebar d-flex flex-column bg-surface border-end p-3 ${open ? "open" : ""}`}
      style={{
        width: 220,
        minHeight: "100vh",
      }}
    >
      {/* ================= Logo ================= */}

      <div className="d-flex align-items-center justify-content-between gap-2 mb-4 px-2">

        <div className="d-flex align-items-center gap-2">
          <LuWallet
            size={22}
            className="text-primary"
          />

          <span className="font-display fw-semibold fs-5">
            BudgetBuddy
          </span>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-link text-muted-ink d-lg-none p-1"
          onClick={onClose}
          aria-label="Close menu"
        >
          <LuX size={20} />
        </button>

      </div>

      {/* ================= Navigation ================= */}

      <nav className="d-flex flex-column gap-1 flex-grow-1">

        <NavLink
          to="/dashboard"
          className={navClass}
          onClick={onClose}
        >
          <LuLayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/expenses"
          className={navClass}
          onClick={onClose}
        >
          <LuWallet size={18} />
          Expenses
        </NavLink>

        <NavLink
          to="/income"
          className={navClass}
          onClick={onClose}
        >
          <LuPiggyBank size={18} />
          Income
        </NavLink>

        <NavLink
          to="/budgets"
          className={navClass}
          onClick={onClose}
        >
          <LuTarget size={18} />
          Budgets
        </NavLink>

        <NavLink
          to="/savings-goals"
          className={navClass}
          onClick={onClose}
        >
          <LuFlag size={18} />
          Savings Goals
        </NavLink>

        <NavLink
          to="/achievements"
          className={navClass}
          onClick={onClose}
        >
          <LuAward size={18} />
          Achievements
        </NavLink>

        <NavLink
          to="/reports"
          className={navClass}
          onClick={onClose}
        >
          <LuChartColumn size={18} />
          Reports
        </NavLink>

        <NavLink
          to="/notifications"
          className={navClass}
          onClick={onClose}
        >
          <LuBellRing size={18} />
          Notifications
        </NavLink>

        <NavLink
          to="/settings"
          className={navClass}
          onClick={onClose}
        >
          <LuSettings size={18} />
          Settings
        </NavLink>

      </nav>

      {/* ================= Utility (theme + logout) =================
          Visually separated from navigation (border-top + its own
          top margin/padding) per the redesign - a quick theme toggle
          and Logout, always reachable without opening Settings.
          Theme: the exact same usePreferences().setTheme every other
          theme control in the app already uses (Landing Page's own
          toggle, previously Settings > Appearance) - just a compact
          light/dark segment here rather than the 3-way Light/Dark/
          System picker, since a bottom-of-sidebar quick toggle isn't
          the place for the System option; System is still reachable
          by anyone who wants it since setTheme("system") still works
          exactly as before, there's just no control left that sets it. */}
      <div className="pt-3 mt-2 border-top d-flex flex-column gap-2">
        <div
          className="sidebar-theme-toggle"
          role="group"
          aria-label="Theme"
        >
          <button
            type="button"
            className={`sidebar-theme-option ${resolvedTheme === "light" ? "active" : ""}`}
            onClick={() => setTheme("light")}
            aria-label="Switch to light theme"
            title="Light theme"
          >
            <LuSun size={15} />
            Light
          </button>
          <button
            type="button"
            className={`sidebar-theme-option ${resolvedTheme === "dark" ? "active" : ""}`}
            onClick={() => setTheme("dark")}
            aria-label="Switch to dark theme"
            title="Dark theme"
          >
            <LuMoon size={15} />
            Dark
          </button>
        </div>

        <button
          type="button"
          className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center gap-2"
          onClick={() => setConfirmOpen(true)}
        >
          <LuLogOut size={15} />
          Logout
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out of BudgetBuddy?"
        message="You'll be returned to the home page."
        confirmLabel="Log Out"
        variant="danger"
        loading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

    </aside>
  );
}