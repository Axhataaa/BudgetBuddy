import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LuMenu } from "react-icons/lu";
import Sidebar from "../components/layout/Sidebar";

export default function AppShell() {
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

        <Outlet />
      </main>
    </div>
  );
}
