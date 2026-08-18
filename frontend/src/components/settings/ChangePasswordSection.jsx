import { useState } from "react";
import { LuLock } from "react-icons/lu";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { changePassword } from "../../services/profileService";

export default function ChangePasswordSection() {
  const { showToast } = useToast();

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_new_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = (field) => (e) => {
    setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setPasswordErrors({ confirm_new_password: "Passwords do not match." });
      return;
    }
    setPasswordErrors({});
    setChangingPassword(true);
    try {
      await changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      showToast("Password updated.", "success");
      setPasswordForm({ old_password: "", new_password: "", confirm_new_password: "" });
    } catch (err) {
      const details = err.response?.data?.error?.details;
      if (details) {
        setPasswordErrors({
          old_password: details.old_password?.[0],
          new_password: details.new_password?.[0],
        });
      } else {
        showToast("Couldn't change password.", "error");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="bg-surface rounded shadow-token-sm hover-card p-4">
      <h2 className="font-display fs-6 fw-semibold mb-3 d-flex align-items-center gap-2">
        <LuLock size={16} />
        Change Password
      </h2>
      <form onSubmit={handlePasswordSubmit}>
        <Input
          label="Current Password"
          type="password"
          showPasswordToggle
          value={passwordForm.old_password}
          onChange={handlePasswordChange("old_password")}
          error={passwordErrors.old_password}
        />
        <div className="row">
          <div className="col-6">
            <Input
              label="New Password"
              type="password"
              showPasswordToggle
              value={passwordForm.new_password}
              onChange={handlePasswordChange("new_password")}
              error={passwordErrors.new_password}
            />
          </div>
          <div className="col-6">
            <Input
              label="Confirm New Password"
              type="password"
              showPasswordToggle
              value={passwordForm.confirm_new_password}
              onChange={handlePasswordChange("confirm_new_password")}
              error={passwordErrors.confirm_new_password}
            />
          </div>
        </div>
        <div className="d-flex justify-content-end mt-2">
          <Button type="submit" variant="secondary" loading={changingPassword}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
