import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";

export default function AppShell() {
  return (
    <div className="d-flex">
      <Sidebar />
      <main className="flex-grow-1 p-4" style={{ backgroundColor: "var(--color-bg)" }}>
        <Outlet />
      </main>
    </div>
  );
}
