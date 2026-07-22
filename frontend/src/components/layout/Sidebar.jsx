import { NavLink } from "react-router-dom";
import {
  LuAward,
  LuChartColumn,
  LuFlag,
  LuLayoutDashboard,
  LuPiggyBank,
  LuSettings,
  LuTarget,
  LuWallet,
  LuX,
} from "react-icons/lu";

export default function Sidebar({ open = false, onClose }) {
  const navClass = ({ isActive }) =>
    `d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${
      isActive
        ? "bg-primary text-white"
        : "text-muted-ink"
    }`;

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
          to="/settings"
          className={navClass}
          onClick={onClose}
        >
          <LuSettings size={18} />
          Settings
        </NavLink>

      </nav>

    </aside>
  );
}