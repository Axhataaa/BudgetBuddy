import { useState } from "react";

function ToggleRow({ label, description, checked, onChange, disabled, isLast }) {
  return (
    <div className={`d-flex align-items-center justify-content-between py-3 ${isLast ? "" : "border-bottom"}`}>
      <div className="pe-3">
        <div className="fw-medium small">{label}</div>
        {description && <div className="text-muted-ink small">{description}</div>}
      </div>
      <div className="form-check form-switch mb-0 flex-shrink-0">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={{ width: 42, height: 24, cursor: disabled ? "default" : "pointer" }}
        />
      </div>
    </div>
  );
}

/**
 * Two toggles, each saved independently the moment it's flipped
 * (Instagram/Google settings convention - no separate Save button for
 * simple on/off preferences). Both map directly to Profile fields
 * from the Backend Preferences step; no new backend surface needed.
 */
export default function NotificationsSection({ email, budgetAlerts, onSave, loading }) {
  const [savingField, setSavingField] = useState(null);

  const handleToggle = async (field, checked) => {
    setSavingField(field);
    try {
      await onSave({ [field]: checked });
    } finally {
      setSavingField(null);
    }
  };

  return (
    <div id="notifications" className="bg-surface rounded shadow-token-sm hover-card p-4">
      <h2 className="font-display fs-6 fw-semibold mb-1">Notifications</h2>
      <p className="text-muted-ink small mb-3">Choose what BudgetBuddy should notify you about.</p>

      {loading ? (
        <>
          <span className="placeholder-glow d-block mb-3">
            <span className="placeholder col-12" style={{ height: 40 }} />
          </span>
          <span className="placeholder-glow d-block">
            <span className="placeholder col-12" style={{ height: 40 }} />
          </span>
        </>
      ) : (
        <div>
          <ToggleRow
            label="Email notifications"
            description="Receive account and activity updates by email."
            checked={email}
            onChange={(checked) => handleToggle("email_notifications", checked)}
            disabled={savingField === "email_notifications"}
          />
          <ToggleRow
            label="Budget alerts"
            description="Get notified when a budget nears or exceeds its limit."
            checked={budgetAlerts}
            onChange={(checked) => handleToggle("budget_alert_notifications", checked)}
            disabled={savingField === "budget_alert_notifications"}
            isLast
          />
        </div>
      )}
    </div>
  );
}
