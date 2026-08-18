import ProfileSection from "../../components/settings/ProfileSection";
import ChangePasswordSection from "../../components/settings/ChangePasswordSection";

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
