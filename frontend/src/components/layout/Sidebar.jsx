import { NavLink } from "react-router-dom";
import {
  LuAward,
  LuChartColumn,
  LuCircleUserRound,
  LuFlag,
  LuLayoutDashboard,
  LuLogOut,
  LuPiggyBank,
  LuSettings,
  LuTarget,
  LuWallet,
} from "react-icons/lu";

import { useAuth } from "../../hooks/useAuth";

export default function Sidebar() {
  const { logout } = useAuth();

  const navClass = ({ isActive }) =>
    `d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${
      isActive
        ? "bg-primary text-white"
        : "text-muted-ink"
    }`;

  return (
    <aside
      className="d-flex flex-column bg-surface border-end p-3"
      style={{
        width: 220,
        minHeight: "100vh",
      }}
    >
      {/* ================= Logo ================= */}

      <div className="d-flex align-items-center gap-2 mb-4 px-2">

        <LuWallet
          size={22}
          className="text-primary"
        />

        <span className="font-display fw-semibold fs-5">
          BudgetBuddy
        </span>

      </div>

      {/* ================= Navigation ================= */}

      <nav className="d-flex flex-column gap-1 flex-grow-1">

        <NavLink
          to="/dashboard"
          className={navClass}
        >
          <LuLayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/expenses"
          className={navClass}
        >
          <LuWallet size={18} />
          Expenses
        </NavLink>

        <NavLink
          to="/income"
          className={navClass}
        >
          <LuPiggyBank size={18} />
          Income
        </NavLink>

        <NavLink
          to="/budgets"
          className={navClass}
        >
          <LuTarget size={18} />
          Budgets
        </NavLink>

        <NavLink
          to="/savings-goals"
          className={navClass}
        >
          <LuFlag size={18} />
          Savings Goals
        </NavLink>

        <NavLink
          to="/achievements"
          className={navClass}
        >
          <LuAward size={18} />
          Achievements
        </NavLink>

        <NavLink
          to="/reports"
          className={navClass}
        >
          <LuChartColumn size={18} />
          Reports
        </NavLink>

        <NavLink
          to="/settings"
          className={navClass}
        >
          <LuSettings size={18} />
          Settings
        </NavLink>

      </nav>

      {/* ================= Footer ================= */}

      <div>

        <hr className="my-2" />

        <NavLink
          to="/profile"
          className={navClass}
        >
          <LuCircleUserRound size={18} />
          My Profile
        </NavLink>

        <button
          onClick={logout}
          className="btn btn-link text-muted-ink text-decoration-none d-flex align-items-center gap-2 px-2 mt-2"
        >
          <LuLogOut size={18} />
          Log out
        </button>

      </div>

    </aside>
  );
}