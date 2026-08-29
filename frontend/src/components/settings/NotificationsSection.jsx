import { useState } from "react";

function ToggleRow({ label, description, checked, onChange, disabled, isLast, nested }) {
  return (
    <div
      className={`d-flex align-items-center justify-content-between py-3 ${isLast ? "" : "border-bottom"} ${
        nested ? "ps-3 border-start" : ""
      }`}
    >
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
            isLast={!email}
          />

          {email && (
            <div className="ms-3">
              <ToggleRow
                label="Budget alerts"
                description="Get notified when a budget nears (80%+) or exceeds its limit."
                checked={budgetAlerts}
                onChange={(checked) => handleToggle("budget_alert_notifications", checked)}
                disabled={savingField === "budget_alert_notifications"}
                nested
              />
              <ToggleRow
                label="Savings goal updates"
                description="Get notified by email when a savings goal is completed or needs a reminder."
                checked={savingsGoalUpdates}
                onChange={(checked) => handleToggle("email_savings_goal_notifications", checked)}
                disabled={savingField === "email_savings_goal_notifications"}
                nested
              />
              <ToggleRow
                label="Monthly reports"
                description="Get an email when your monthly financial report is ready."
                checked={monthlyReports}
                onChange={(checked) => handleToggle("email_monthly_report_notifications", checked)}
                disabled={savingField === "email_monthly_report_notifications"}
                nested
              />
              <ToggleRow
                label="Important notifications"
                description="Security and other important account notices by email."
                checked={importantNotifications}
                onChange={(checked) => handleToggle("email_important_notifications", checked)}
                disabled={savingField === "email_important_notifications"}
                nested
              />
              <ToggleRow
                label="Achievements"
                description="Get notified by email when you unlock an achievement."
                checked={achievements}
                onChange={(checked) => handleToggle("email_achievement_notifications", checked)}
                disabled={savingField === "email_achievement_notifications"}
                nested
                isLast
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
