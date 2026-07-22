import { useEffect, useRef, useState } from "react";
import { LuUser, LuCamera, LuImage, LuTrash2, LuChevronDown } from "react-icons/lu";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { getProfile, updateProfile } from "../../services/profileService";

// Mirrors backend Profile.Role exactly - kept in sync with the same
// choices Register.jsx uses (Premium/Admin are not user role values).
const ROLE_LABELS = {
  student: "Student",
  working_professional: "Working Professional",
  freelancer: "Freelancer",
  business_owner: "Business Owner",
  other: "Other",
  admin: "Admin",
};

/**
 * Account details (avatar + profile fields) section. Extracted from
 * the original Profile.jsx as-is - same state, same handlers, same
 * validation/error handling - so it can be embedded both on the
 * standalone /profile page and inside Settings without duplicating
 * this logic in two places.
 *
 * onProfileLoaded/onProfileUpdated are optional callbacks so a parent
 * (e.g. Settings) can read the loaded profile for other sections
 * (Appearance, Currency, etc.) without this component needing to know
 * anything about those sections.
 */
export default function ProfileSection({ onProfileLoaded, onProfileUpdated }) {
  const { showToast } = useToast();
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const photoMenuRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", full_name: "", email: "", phone_number: "", bio: "" });
  const [formErrors, setFormErrors] = useState({});
  const [pendingPicture, setPendingPicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
      setForm({
        username: data.username || "",
        full_name: data.full_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        bio: data.bio || "",
      });
      onProfileLoaded?.(data);
    } catch {
      showToast("Couldn't load your profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the photo menu on outside click - same pattern as Modal's
  // backdrop-click-to-close, adapted for a dropdown that isn't a modal.
  useEffect(() => {
    if (!photoMenuOpen) return;
    const handleClickOutside = (e) => {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target)) {
        setPhotoMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [photoMenuOpen]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePictureSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingPicture(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = ""; // allow re-selecting the same file later
  };

  const handleRemovePhoto = async () => {
    setPhotoMenuOpen(false);
    setRemovingPhoto(true);
    try {
      const updated = await updateProfile({ profile_picture: null });
      setProfile(updated);
      setPendingPicture(null);
      setPreviewUrl(null);
      onProfileUpdated?.(updated);
      showToast("Profile picture removed.", "success");
    } catch {
      showToast("Couldn't remove profile picture.", "error");
    } finally {
      setRemovingPhoto(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSaving(true);
    try {
      const payload = { ...form };
      if (pendingPicture) payload.profile_picture = pendingPicture;
      const updated = await updateProfile(payload);
      setProfile(updated);
      setForm((prev) => ({ ...prev, username: updated.username }));
      setPendingPicture(null);
      setPreviewUrl(null);
      onProfileUpdated?.(updated);
      showToast("Profile updated.", "success");
    } catch (err) {
      const details = err.response?.data?.error?.details;
      if (details) {
        // "This username is already taken." arrives here exactly as
        // the backend phrased it (API Design Doc §7's details shape) -
        // displayed inline under the Username field, not just a toast.
        setFormErrors(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v?.[0] || v])));
      }
      const message = err.response?.data?.error?.message || "Couldn't save your profile.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-muted-ink small">Loading profile...</div>;
  }

  const hasPhoto = Boolean(previewUrl) || Boolean(profile?.profile_picture);
  const avatarSrc = previewUrl ?? profile?.profile_picture ?? null;

  return (
    <div className="row g-4">
      <div className="col-md-4">
        <div className="bg-surface rounded shadow-token-sm hover-card p-4 text-center">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle bg-surface-sunken"
            style={{ width: 120, height: 120, overflow: "hidden" }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <LuUser size={48} className="text-muted-ink" />
            )}
          </div>

          {/* Hidden file inputs - one plain, one with capture="environment"
              so mobile browsers open the camera directly. Both share
              the same onChange handler; which one fires depends on
              which menu item was clicked. Desktop browsers without
              camera support simply ignore the capture attribute. */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="d-none"
            onChange={handlePictureSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="d-none"
            onChange={handlePictureSelect}
          />

          <div className="position-relative d-inline-block" ref={photoMenuRef}>
            <Button
              variant="ghost"
              icon={LuCamera}
              loading={removingPhoto}
              onClick={() => setPhotoMenuOpen((open) => !open)}
            >
              Change Photo <LuChevronDown size={14} />
            </Button>

            {photoMenuOpen && (
              <div
                className="position-absolute bg-surface shadow-token-md rounded p-1 mt-1"
                style={{ zIndex: 10, minWidth: 200, left: "50%", transform: "translateX(-50%)" }}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-link text-ink text-decoration-none d-flex align-items-center gap-2 w-100 text-start"
                  onClick={() => {
                    cameraInputRef.current?.click();
                    setPhotoMenuOpen(false);
                  }}
                >
                  <LuCamera size={16} />
                  Take Photo
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-ink text-decoration-none d-flex align-items-center gap-2 w-100 text-start"
                  onClick={() => {
                    galleryInputRef.current?.click();
                    setPhotoMenuOpen(false);
                  }}
                >
                  <LuImage size={16} />
                  Choose from Device
                </button>
                {hasPhoto && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger text-decoration-none d-flex align-items-center gap-2 w-100 text-start"
                    onClick={handleRemovePhoto}
                  >
                    <LuTrash2 size={16} />
                    Remove Photo
                  </button>
                )}
              </div>
            )}
          </div>

          <hr />

          <div className="text-start small">
            <div className="text-muted-ink mb-1">Role</div>
            <div className="mb-3">
              <span className="badge bg-primary">{ROLE_LABELS[profile?.role] || profile?.role}</span>
            </div>

            <div className="text-muted-ink mb-1">Member Since</div>
            <div className="fw-medium">
              {profile?.date_joined
                ? new Date(profile.date_joined).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-8">
        <div className="bg-surface rounded shadow-token-sm hover-card p-4">
          <h2 className="font-display fs-6 fw-semibold mb-3">Account Details</h2>
          <form onSubmit={handleSave}>
            <div className="row">
              <div className="col-6">
                <Input
                  label="Username"
                  value={form.username}
                  onChange={handleChange("username")}
                  error={formErrors.username}
                />
              </div>
              <div className="col-6">
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  error={formErrors.email}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-6">
                <Input label="Full Name" value={form.full_name} onChange={handleChange("full_name")} />
              </div>
              <div className="col-6">
                <Input
                  label="Phone Number"
                  value={form.phone_number}
                  onChange={handleChange("phone_number")}
                />
              </div>
            </div>

            <Input
              label="Bio / About (optional)"
              as="textarea"
              value={form.bio}
              onChange={handleChange("bio")}
            />

            <div className="d-flex justify-content-end mt-2">
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
