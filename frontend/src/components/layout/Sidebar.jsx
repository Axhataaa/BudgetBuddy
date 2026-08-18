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
import { useNotifications } from "../../hooks/useNotifications";

export default function Sidebar({ open = false, onClose }) {
  const { resolvedTheme, setTheme } = usePreferences();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const unreadBadgeLabel = unreadCount > 19 ? "19+" : String(unreadCount);

  const navClass = ({ isActive }) =>
    `d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${
      isActive
        ? "bg-primary text-white"
        : "text-muted-ink"
    }`;

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
        width: 240,
        minHeight: "100vh",
      }}
    >

      <div className="d-flex align-items-center gap-2 mb-4">

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <LuWallet
            size={22}
            className="text-primary flex-shrink-0"
          />

          <span className="font-display fw-semibold fs-5 text-nowrap">
            BudgetBuddy
          </span>
        </div>

        <button
          type="button"
          className="sidebar-close-btn d-lg-none ms-auto"
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
          {unreadCount > 0 && (
            <span
              className="sidebar-notification-badge ms-auto"
              aria-label={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
            >
              {unreadBadgeLabel}
            </span>
          )}
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

      {}

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
