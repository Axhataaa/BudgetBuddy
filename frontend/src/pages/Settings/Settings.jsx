import { useState } from "react";
import { updateProfile } from "../../services/profileService";
import { useToast } from "../../components/ui/Toast";

import ProfileSection from "../../components/settings/ProfileSection";
import ChangePasswordSection from "../../components/settings/ChangePasswordSection";
import SettingsNav from "../../components/settings/SettingsNav";
import AppearanceSection from "../../components/settings/AppearanceSection";
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
      <h1 className="font-display fs-3 fw-semibold mb-1">Settings</h1>
      <p className="text-muted-ink small mb-4">Manage your account, preferences and data.</p>

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

          <AppearanceSection onSave={savePreferences} />

          <CurrencySection onSave={savePreferences} />

          <NotificationsSection
            email={profile?.email_notifications ?? true}
            budgetAlerts={profile?.budget_alert_notifications ?? true}
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
