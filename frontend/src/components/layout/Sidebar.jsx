import { NavLink } from "react-router-dom";
import { LuLayoutDashboard, LuWallet, LuPiggyBank, LuTarget, LuLogOut } from "react-icons/lu";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside
      className="d-flex flex-column bg-surface border-end p-3"
      style={{ width: 220, minHeight: "100vh" }}
    >
      <div className="d-flex align-items-center gap-2 mb-4 px-2">
        <LuWallet size={22} className="text-primary" />
        <span className="font-display fw-semibold fs-5">BudgetBuddy</span>
      </div>

      <nav className="d-flex flex-column gap-1 flex-grow-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${
              isActive ? "bg-primary text-white" : "text-muted-ink"
            }`
          }
        >
          <LuLayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            `d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${
              isActive ? "bg-primary text-white" : "text-muted-ink"
            }`
          }
        >
          <LuWallet size={18} />
          Expenses
        </NavLink>
        <NavLink
          to="/income"
          className={({ isActive }) =>
            `d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${
              isActive ? "bg-primary text-white" : "text-muted-ink"
            }`
          }
        >
          <LuPiggyBank size={18} />
          Income
        </NavLink>
        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            `d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none ${
              isActive ? "bg-primary text-white" : "text-muted-ink"
            }`
          }
        >
          <LuTarget size={18} />
          Budgets
        </NavLink>
        {/* Savings Goals, Reports, Notifications, Profile, Settings are
            added here as each module ships - no placeholder links for
            pages that don't exist yet. */}
      </nav>

      <button
        onClick={logout}
        className="btn btn-link text-muted-ink text-decoration-none d-flex align-items-center gap-2 px-2"
      >
        <LuLogOut size={18} />
        Log out
      </button>
    </aside>
  );
}
