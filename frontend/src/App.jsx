import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Authentication/Login";
import Register from "./pages/Authentication/Register";

import Dashboard from "./pages/Dashboard/Dashboard";
import Expenses from "./pages/Expenses/Expenses";
import Income from "./pages/Income/Income";
import Budgets from "./pages/Budgets/Budgets";
import SavingsGoals from "./pages/SavingsGoals/SavingsGoals";
import Achievements from "./pages/Achievements/Achievements";
import Reports from "./pages/Reports/Reports";
import Notifications from "./pages/Notifications/Notifications";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Settings/Settings";

import AppShell from "./app/AppShell";
import ProtectedRoute from "./app/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= Public Routes ================= */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
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