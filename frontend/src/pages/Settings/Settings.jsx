import { useState } from "react";
import { LuSettings } from "react-icons/lu";
import { updateProfile } from "../../services/profileService";
import { useToast } from "../../components/ui/Toast";

import ProfileSection from "../../components/settings/ProfileSection";
import ChangePasswordSection from "../../components/settings/ChangePasswordSection";
import SettingsNav from "../../components/settings/SettingsNav";
import CurrencySection from "../../components/settings/CurrencySection";
import NotificationsSection from "../../components/settings/NotificationsSection";
import FinancialPreferencesSection from "../../components/settings/FinancialPreferencesSection";
import DataManagementSection from "../../components/settings/DataManagementSection";
import LogoutSection from "../../components/settings/LogoutSection";
import DangerZoneSection from "../../components/settings/DangerZoneSection";

export default function Settings() {
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("profile-security");

  const handleProfileLoaded = (data) => {
    setProfile(data);
    setProfileLoading(false);
  };

  const handleProfileUpdated = (data) => {
    setProfile(data);
  };

  const savePreferences = async (partialPayload) => {
    try {
      const updated = await updateProfile(partialPayload);
      setProfile(updated);
      showToast("Settings updated.", "success");
      return updated;
    } catch (err) {
      const message = err.response?.data?.error?.message || "Couldn't save your changes.";
      showToast(message, "error");
      throw err;
    }
  };

  // All category panels stay mounted at all times; only visibility toggles.
  // This preserves existing data flow (e.g. ProfileSection loading/lifting
  // profile state on mount) so switching categories never loses or
  // refetches data.
  const categoryClass = (id) => (activeCategory === id ? "" : "d-none");

  return (
    <div>
      <div className="bg-surface rounded shadow-token-sm p-4 mb-4 d-flex align-items-center gap-3">
        <span className="page-header-icon icon-settings">
          <LuSettings size={22} />
        </span>
        <div>
          <h1 className="font-display fs-3 fw-semibold mb-1">Settings</h1>
          <p className="text-muted-ink mb-0">Manage your account, preferences and data.</p>
        </div>
      </div>

      <div className="d-flex flex-column gap-4">
        <SettingsNav active={activeCategory} onSelect={setActiveCategory} />

        <div>
          <div className={`d-flex flex-column gap-4 ${categoryClass("profile-security")}`}>
            <div id="profile">
              <h2 className="font-display fs-6 fw-semibold mb-3">Profile</h2>
              <ProfileSection onProfileLoaded={handleProfileLoaded} onProfileUpdated={handleProfileUpdated} />
            </div>

            <div id="change-password">
              <ChangePasswordSection />
            </div>
          </div>

          <div className={`d-flex flex-column gap-4 ${categoryClass("currency-financial")}`}>
            <CurrencySection onSave={savePreferences} />

            <FinancialPreferencesSection
              savingTarget={profile?.monthly_saving_target}
              onSave={savePreferences}
              loading={profileLoading}
            />
          </div>

          <div className={`d-flex flex-column gap-4 ${categoryClass("notifications")}`}>
            <NotificationsSection
              email={profile?.email_notifications ?? true}
              budgetAlerts={profile?.budget_alert_notifications ?? true}
              savingsGoalUpdates={profile?.email_savings_goal_notifications ?? true}
              monthlyReports={profile?.email_monthly_report_notifications ?? true}
              importantNotifications={profile?.email_important_notifications ?? true}
              achievements={profile?.email_achievement_notifications ?? false}
              onSave={savePreferences}
              loading={profileLoading}
            />
          </div>

          <div className={`d-flex flex-column gap-4 ${categoryClass("data-management")}`}>
            <DataManagementSection />
          </div>

          <div className={`d-flex flex-column gap-4 ${categoryClass("account-actions")}`}>
            <LogoutSection />
            <DangerZoneSection />
          </div>
        </div>
      </div>
    </div>
  );
}
