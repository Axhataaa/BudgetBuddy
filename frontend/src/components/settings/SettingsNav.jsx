const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "change-password", label: "Change Password" },
  { id: "appearance", label: "Appearance" },
  { id: "currency", label: "Currency" },
  { id: "notifications", label: "Notifications" },
  { id: "financial-preferences", label: "Financial Preferences" },
  { id: "data-management", label: "Data Management" },
  { id: "about", label: "About" },
  { id: "logout", label: "Log Out" },
  { id: "danger-zone", label: "Danger Zone" },
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function SettingsNav() {
  return (
    <nav className="d-none d-lg-block" style={{ position: "sticky", top: 90 }}>
      <div className="bg-surface rounded shadow-token-sm p-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`btn btn-sm btn-link text-decoration-none d-block w-100 text-start px-3 py-2 ${
              s.id === "logout" || s.id === "danger-zone" ? "text-danger" : "text-ink"
            }`}
            onClick={() => scrollToSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
