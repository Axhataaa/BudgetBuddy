import ProfileSection from "../../components/settings/ProfileSection";
import ChangePasswordSection from "../../components/settings/ChangePasswordSection";

// Thin wrapper around the shared Settings sections - kept as its own
// route/page so any existing links or bookmarks to /profile keep
// working exactly as before. The actual form logic lives in
// components/settings/ProfileSection.jsx and ChangePasswordSection.jsx,
// which Settings.jsx also renders - one implementation, two entry points.
export default function Profile() {
  return (
    <div>
      <h1 className="font-display fs-3 fw-semibold mb-4">My Profile</h1>
      <ProfileSection />
      <div className="row g-4 mt-0">
        <div className="col-md-4" />
        <div className="col-md-8">
          <div className="mt-4">
            <ChangePasswordSection />
          </div>
        </div>
      </div>
    </div>
  );
}
