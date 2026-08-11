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
import AboutSection from "../../components/settings/AboutSection";
import LogoutSection from "../../components/settings/LogoutSection";
import DangerZoneSection from "../../components/settings/DangerZoneSection";

export default function Settings() {
  const { showToast } = useToast();

  // Populated by ProfileSection's onProfileLoaded/onProfileUpdated
  // callbacks - Settings doesn't fetch the profile a second time,
  // it just observes the same load that ProfileSection already does
  // for itself, so there's exactly one GET /users/me/ on page load
  // from this page (PreferencesContext independently fetches a much
  // smaller slice - just theme/currency - once per app session, to
  // apply them before Settings is ever visited).
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const handleProfileLoaded = (data) => {
    setProfile(data);
    setProfileLoading(false);
  };

  const handleProfileUpdated = (data) => {
    setProfile(data);
  };

  // Shared save path for every preference section below - one PATCH
  // /users/me/ call, one toast, reused instead of every section
  // duplicating its own request/error/toast handling.
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

      <div className="row g-4">
        <div className="col-lg-3">
          <SettingsNav />
        </div>

        <div className="col-lg-9 d-flex flex-column gap-4">
          <div id="profile">
            <h2 className="font-display fs-6 fw-semibold mb-3">Profile</h2>
            <ProfileSection onProfileLoaded={handleProfileLoaded} onProfileUpdated={handleProfileUpdated} />
          </div>

          <div id="change-password">
            <ChangePasswordSection />
          </div>

          {/* Appearance/theme is now a sidebar-level quick toggle
              (present on every authenticated page, see Sidebar.jsx),
              persisted through the same PreferencesContext.setTheme
              this section used to call via onSave - removed here to
              avoid two separate theme controls in the app. The one
              thing that control offered that the compact sidebar
              toggle doesn't is a "System" (match OS) option; that
              value still works fine if ever set (setTheme("system")
              is unchanged), there's just no UI left that sets it. */}

          <CurrencySection onSave={savePreferences} />

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

          <FinancialPreferencesSection
            savingTarget={profile?.monthly_saving_target}
            warningThreshold={profile?.budget_warning_threshold}
            onSave={savePreferences}
            loading={profileLoading}
          />

          <DataManagementSection />

          <AboutSection />

          <LogoutSection />

          <DangerZoneSection />
        </div>
      </div>
    </div>
  );
}
