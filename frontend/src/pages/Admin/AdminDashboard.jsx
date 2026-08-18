import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuWallet,
  LuLogOut,
  LuUsers,
  LuReceipt,
  LuTrendingUp,
  LuFolderOpen,
  LuPiggyBank,
  LuBell,
} from "react-icons/lu";

import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";

import { StatCard, StatCardSkeleton } from "../../components/dashboard/StatCards";
import ExpensePieChart from "../../components/dashboard/ExpensePieChart";
import RegistrationsChart from "../../components/admin/RegistrationsChart";

import { getAdminStats } from "../../services/adminService";
import { formatRelativeDate } from "../../utils/formatRelativeDate";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch {
        showToast("Couldn't load admin statistics. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-surface">
        <div className="d-flex align-items-center gap-2">
          <LuWallet size={22} className="text-primary" />
          <span className="font-display fs-5 fw-semibold">BudgetBuddy Admin</span>
        </div>
        <Button variant="ghost" icon={LuLogOut} onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="flex-grow-1 p-4">
        <div className="mb-3">
          <h1 className="font-display fs-3 fw-semibold mb-0">Admin Dashboard</h1>
          <p className="text-muted-ink small mb-0">
            Platform-wide monitoring - read only, no user financial data can be edited here.
          </p>
        </div>

        {/* ================= Stat Cards ================= */}
        {loading || !stats ? (
          <div className="row g-3 mb-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
          <>
            <div className="row g-3 mb-3">
              <StatCard
                label="Total Users"
                amount={stats.total_users}
                isCurrency={false}
                subtitle="Registered accounts"
                colorClass="text-primary"
                icon={LuUsers}
              />
              <StatCard
                label="Total Expense Records"
                amount={stats.totals.expenses}
                isCurrency={false}
                subtitle="Across all users"
                colorClass="text-expense"
                icon={LuReceipt}
              />
              <StatCard
                label="Total Income Records"
                amount={stats.totals.incomes}
                isCurrency={false}
                subtitle="Across all users"
                colorClass="text-income"
                icon={LuTrendingUp}
              />
              <StatCard
                label="Total Budgets"
                amount={stats.totals.budgets}
                isCurrency={false}
                subtitle="Across all users"
                colorClass="text-ink"
                icon={LuFolderOpen}
              />
            </div>

            <div className="row g-3 mb-3">
              <StatCard
                label="Total Savings Goals"
                amount={stats.totals.savings_goals}
                isCurrency={false}
                subtitle="Across all users"
                colorClass="text-income"
                icon={LuPiggyBank}
              />
              <StatCard
                label="Total Notifications"
                amount={stats.totals.notifications}
                isCurrency={false}
                subtitle="System-wide"
                colorClass="text-warning"
                icon={LuBell}
              />
            </div>
          </>
        )}

        {/* ================= Charts ================= */}
        <div className="row g-3 mb-3">
          <div className="col-lg-6">
            <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
              <h2 className="font-display fs-6 fw-semibold mb-0">Users by Occupation</h2>
              <p className="text-muted-ink small mb-3">What users selected at registration</p>

              {loading || !stats ? (
                <div className="text-center py-5 text-muted-ink">Loading...</div>
              ) : (
                <ExpensePieChart
                  data={stats.users_by_occupation}
                  labelKey="occupation"
                  valueKey="value"
                  emptyMessage="No users registered yet."
                />
              )}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="bg-surface rounded shadow-token-sm hover-card p-3 h-100">
              <h2 className="font-display fs-6 fw-semibold mb-0">Monthly Registrations</h2>
              <p className="text-muted-ink small mb-3">New users over the last 6 months</p>

              {loading || !stats ? (
                <div className="text-center py-5 text-muted-ink">Loading...</div>
              ) : (
                <RegistrationsChart data={stats.monthly_registrations} />
              )}
            </div>
          </div>
        </div>

        {/* ================= Recent Users ================= */}
        <div className="bg-surface rounded shadow-token-sm hover-card p-3">
          <h2 className="font-display fs-6 fw-semibold mb-0">Recent Users</h2>
          <p className="text-muted-ink small mb-3">Latest 10 registrations</p>

          {loading || !stats ? (
            <div className="text-center py-5 text-muted-ink">Loading...</div>
          ) : stats.recent_users.length === 0 ? (
            <EmptyState icon={LuUsers} message="No users have registered yet." />
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr className="text-muted-ink small">
                    <th>Username</th>
                    <th>Email</th>
                    <th>Occupation</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_users.map((user) => (
                    <tr key={user.id}>
                      <td className="fw-medium">{user.username}</td>
                      <td className="text-muted-ink">{user.email || "—"}</td>
                      <td>
                        <span className="badge bg-surface-sunken text-ink">{user.occupation}</span>
                      </td>
                      <td className="text-muted-ink">{formatRelativeDate(user.date_joined)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
