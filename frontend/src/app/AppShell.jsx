import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LuMenu } from "react-icons/lu";
import Sidebar from "../components/layout/Sidebar";
import { usePreferences } from "../hooks/usePreferences";

export default function AppShell() {
  const { currency, rates } = usePreferences();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="sidebar-scrim open d-lg-none"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="app-content flex-grow-1" style={{ backgroundColor: "var(--color-bg)" }}>
        <button
          type="button"
          className="topbar-menu-btn d-lg-none mb-3"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <LuMenu size={18} />
        </button>

        {/* Keyed on currency AND its resolved rate: formatCurrency's
            active currency/rate (see utils/formatCurrency.js) isn't
            itself reactive, so this remounts whichever page is
            currently showing whenever either changes - when the user
            switches currency in Settings, and also when the async
            exchange-rate fetch resolves after initial load (the rate
            for the current currency can change independently of the
            currency code itself). */}
        <Outlet key={`${currency}-${rates[currency] ?? 1}`} />
      </main>
    </div>
  );
}
