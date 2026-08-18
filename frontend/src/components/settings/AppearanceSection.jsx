import { useState } from "react";
import { LuSun, LuMoon, LuMonitor } from "react-icons/lu";
import { usePreferences } from "../../hooks/usePreferences";

const OPTIONS = [
  { value: "light", label: "Light", icon: LuSun },
  { value: "dark", label: "Dark", icon: LuMoon },
  { value: "system", label: "System", icon: LuMonitor },
];

export default function AppearanceSection({ onSave }) {
  const { theme, setTheme } = usePreferences();
  const [saving, setSaving] = useState(false);

  const handleSelect = async (nextTheme) => {
    if (nextTheme === theme || saving) return;
    const previousTheme = theme;
    setTheme(nextTheme);
    setSaving(true);
    try {
      await onSave({ theme: nextTheme });
    } catch {
      setTheme(previousTheme);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="appearance" className="bg-surface rounded shadow-token-sm hover-card p-4">
      <h2 className="font-display fs-6 fw-semibold mb-1">Appearance</h2>
      <p className="text-muted-ink small mb-3">Choose how BudgetBuddy looks on this device.</p>

      <div className="row g-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = theme === opt.value;
          return (
            <div className="col-4" key={opt.value}>
              <button
                type="button"
                className={`w-100 border rounded p-3 text-center ${active ? "border-primary" : ""}`}
                style={{
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                  background: active ? "var(--color-bg)" : "transparent",
                  cursor: saving ? "default" : "pointer",
                }}
                onClick={() => handleSelect(opt.value)}
                disabled={saving}
              >
                <Icon size={20} className={active ? "text-primary" : "text-muted-ink"} />
                <div className={`small mt-2 fw-medium ${active ? "text-primary" : "text-ink"}`}>
                  {opt.label}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
