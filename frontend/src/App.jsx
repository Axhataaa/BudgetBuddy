import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import Home from "./pages/Home/Home";
import Login from "./pages/Home/Login";
import Register from "./pages/Home/Register";
import Contact from "./pages/Home/Contact";
import VerifyEmail from "./pages/Home/VerifyEmail";

import Dashboard from "./pages/Dashboard/Dashboard";
import Expenses from "./pages/Expenses/Expenses";
import Income from "./pages/Income/Income";
import Budgets from "./pages/Budgets/Budgets";
import SavingsGoals from "./pages/SavingsGoals/SavingsGoals";
import Achievements from "./pages/Achievements/Achievements";
import Reports from "./pages/Reports/Reports";
import Finora from "./pages/Finora/Finora";
import Notifications from "./pages/Notifications/Notifications";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Settings/Settings";
import AdminDashboard from "./pages/Admin/AdminDashboard";

import AppShell from "./app/AppShell";
import ProtectedRoute from "./app/ProtectedRoute";
import AdminProtectedRoute from "./app/AdminProtectedRoute";

import ForgotPassword from "./pages/Home/ForgotPassword";
import ResetPassword from "./pages/Home/ResetPassword";

function PasswordResetNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePasswordReset = () => {
      navigate("/login", { replace: true });
    };

    window.addEventListener("auth:password-reset", handlePasswordReset);

    return () => {
      window.removeEventListener(
        "auth:password-reset",
        handlePasswordReset
      );
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PasswordResetNavigation />

      <Routes>

        {/* ================= Public Routes ================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />

        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        {/* ================= Protected Routes ================= */}

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/expenses"
            element={<Expenses />}
          />

          <Route
            path="/income"
            element={<Income />}
          />

          <Route
            path="/budgets"
            element={<Budgets />}
          />

          <Route
            path="/savings-goals"
            element={<SavingsGoals />}
          />

          <Route
            path="/achievements"
            element={<Achievements />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/finora"
            element={<Finora />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;