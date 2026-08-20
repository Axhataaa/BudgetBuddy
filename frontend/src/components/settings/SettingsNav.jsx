const CATEGORIES = [
  { id: "profile-security", label: "Profile & Security" },
  { id: "currency-financial", label: "Currency & Financial Preferences" },
  { id: "notifications", label: "Notifications" },
  { id: "data-management", label: "Data Management" },
  { id: "account-actions", label: "Account Actions" },
];

export default function SettingsNav({ active, onSelect }) {
  return (
    <nav>
      <div className="bg-surface rounded shadow-token-sm p-2 d-flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const isActive = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              className={`btn btn-sm text-decoration-none px-3 py-2 ${
                isActive ? "btn-primary" : "btn-link text-ink"
              }`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSelect?.(c.id)}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
