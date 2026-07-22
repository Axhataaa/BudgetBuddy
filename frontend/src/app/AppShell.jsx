import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LuMenu } from "react-icons/lu";
import Sidebar from "../components/layout/Sidebar";
import { usePreferences } from "../hooks/usePreferences";

export default function AppShell() {
  const { currency } = usePreferences();
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

        {/* Keyed on currency: formatCurrency's active currency (see
            utils/formatCurrency.js) isn't itself reactive, so this
            remounts whichever page is currently showing when the
            user changes their currency in Settings, refreshing every
            already-rendered amount immediately. */}
        <Outlet key={currency} />
      </main>
    </div>
  );
}
