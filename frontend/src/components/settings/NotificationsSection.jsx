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
 * Six toggles, each saved independently the moment it's flipped
 * (Instagram/Google settings convention - no separate Save button for
 * simple on/off preferences). All map directly to Profile fields -
 * email_notifications is the master switch; the other five are the
 * per-category gates notifications/email_service.py's _get_email_rule()
 * checks before sending anything. No new backend surface needed - all
 * six fields already exist on Profile and are already exposed by
 * ProfileSerializer; this component was just missing four of the six
 * toggles.
 */
export default function NotificationsSection({
  email,
  budgetAlerts,
  savingsGoalUpdates,
  monthlyReports,
  importantNotifications,
  achievements,
  onSave,
  loading,
}) {
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
            description="Master switch - receive account and activity updates by email."
            checked={email}
            onChange={(checked) => handleToggle("email_notifications", checked)}
            disabled={savingField === "email_notifications"}
          />
          <ToggleRow
            label="Budget alerts"
            description="Get notified when a budget nears (90%+) or exceeds its limit."
            checked={budgetAlerts}
            onChange={(checked) => handleToggle("budget_alert_notifications", checked)}
            disabled={savingField === "budget_alert_notifications"}
          />
          <ToggleRow
            label="Savings goal updates"
            description="Get notified by email when a savings goal is completed."
            checked={savingsGoalUpdates}
            onChange={(checked) => handleToggle("email_savings_goal_notifications", checked)}
            disabled={savingField === "email_savings_goal_notifications"}
          />
          <ToggleRow
            label="Monthly reports"
            description="Get an email when your monthly financial report is ready."
            checked={monthlyReports}
            onChange={(checked) => handleToggle("email_monthly_report_notifications", checked)}
            disabled={savingField === "email_monthly_report_notifications"}
          />
          <ToggleRow
            label="Important notifications"
            description="Security and other important account notices by email."
            checked={importantNotifications}
            onChange={(checked) => handleToggle("email_important_notifications", checked)}
            disabled={savingField === "email_important_notifications"}
          />
          <ToggleRow
            label="Achievements"
            description="Get notified by email when you unlock an achievement. Off by default."
            checked={achievements}
            onChange={(checked) => handleToggle("email_achievement_notifications", checked)}
            disabled={savingField === "email_achievement_notifications"}
            isLast
          />
        </div>
      )}
    </div>
  );
}
