import { useEffect, useRef, useState } from "react";
import {
  LuUser,
  LuUsers,
  LuCalendar,
  LuCake,
  LuCamera,
  LuImage,
  LuTrash2,
  LuChevronDown,
  LuCircleCheck,
  LuTriangleAlert,
} from "react-icons/lu";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { getProfile, updateProfile, resendVerificationEmail } from "../../services/profileService";

const ROLE_LABELS = {
  student: "Student",
  working_professional: "Working Professional",
  freelancer: "Freelancer",
  business_owner: "Business Owner",
  other: "Other",
  admin: "Admin",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

function SummaryRow({ icon: Icon, label, children, isLast }) {
  return (
    <div className={`d-flex align-items-start gap-3 py-2 ${isLast ? "" : "border-bottom"}`}>
      <div
        className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle bg-surface-sunken text-muted-ink"
        style={{ width: 32, height: 32, marginTop: 2 }}
      >
        <Icon size={16} />
      </div>
      <div>
        <div className="text-muted-ink small mb-0" style={{ lineHeight: 1.3 }}>
          {label}
        </div>
        <div className="fw-medium" style={{ lineHeight: 1.4 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ProfileSection({ onProfileLoaded, onProfileUpdated }) {
  const { showToast } = useToast();
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const photoMenuRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    bio: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

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
        date_of_birth: data.date_of_birth || "",
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
  }, []);

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

  const handlePictureSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadingPicture(true);
    try {
      const updated = await updateProfile({ profile_picture: file });
      setProfile(updated);
      onProfileUpdated?.(updated);
      showToast("Profile picture updated.", "success");
    } catch {
      showToast("Couldn't update profile picture.", "error");
    } finally {
      setUploadingPicture(false);

      setPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoMenuOpen(false);
    setRemovingPhoto(true);
    try {
      const updated = await updateProfile({ profile_picture: null });
      setProfile(updated);
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
      const payload = { ...form, date_of_birth: form.date_of_birth || null };
      const updated = await updateProfile(payload);
      setProfile(updated);
      setForm((prev) => ({ ...prev, username: updated.username }));
      onProfileUpdated?.(updated);
      showToast("Profile updated.", "success");
    } catch (err) {
      const details = err.response?.data?.error?.details;
      if (details) {
        setFormErrors(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v?.[0] || v])));
      }
      const message = err.response?.data?.error?.message || "Couldn't save your profile.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      await resendVerificationEmail();
      showToast("Verification email sent. Check your inbox.", "success");
    } catch (err) {
      const message = err.response?.data?.error?.message || "Couldn't send verification email.";
      showToast(message, "error");
    } finally {
      setResendingVerification(false);
    }
  };

  if (loading) {
    return <div className="text-muted-ink small">Loading profile...</div>;
  }

  const hasPhoto = Boolean(previewUrl) || Boolean(profile?.profile_picture);
  const avatarSrc = previewUrl ?? profile?.profile_picture ?? null;
  const age = calculateAge(profile?.date_of_birth);

  return (
    <div className="row g-4 align-items-stretch">
      <div className="col-md-4 d-flex">
        <div className="bg-surface rounded shadow-token-sm hover-card p-4 text-center w-100 h-100 d-flex flex-column">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle bg-surface-sunken"
            style={{ width: 160, height: 160, overflow: "hidden" }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <LuUser size={56} className="text-muted-ink" />
            )}
          </div>

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
              loading={removingPhoto || uploadingPicture}
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

          <div className="text-start">
            <div className="text-muted-ink small fw-semibold text-uppercase mb-2" style={{ letterSpacing: "0.03em" }}>
              Profile Overview
            </div>

            <SummaryRow icon={LuUser} label="Role">
              <span className="badge bg-primary">{ROLE_LABELS[profile?.role] || profile?.role}</span>
            </SummaryRow>

            <SummaryRow icon={LuCalendar} label="Member Since">
              {formatDate(profile?.date_joined)}
            </SummaryRow>

            <SummaryRow icon={LuCake} label="Date of Birth">
              {formatDate(profile?.date_of_birth)}
            </SummaryRow>

            <SummaryRow icon={LuUsers} label="Age" isLast>
              {age != null ? `${age} years old` : "—"}
            </SummaryRow>
          </div>
        </div>
      </div>

      <div className="col-md-8 d-flex">
        <div className="bg-surface rounded shadow-token-sm hover-card p-4 w-100 h-100 d-flex flex-column">
          <h2 className="font-display fs-6 fw-semibold mb-3">Account Details</h2>
          <form onSubmit={handleSave} className="d-flex flex-column flex-grow-1">
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
                {profile?.email_verified ? (
                  <div className="d-flex align-items-center gap-1 text-income small mt-n2 mb-3">
                    <LuCircleCheck size={14} />
                    <span>Verified</span>
                  </div>
                ) : (
                  <div className="d-flex align-items-center flex-wrap gap-2 mt-n2 mb-3">
                    <span className="d-flex align-items-center gap-1 text-warning small">
                      <LuTriangleAlert size={14} />
                      Email not verified
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      loading={resendingVerification}
                      onClick={handleResendVerification}
                    >
                      Verify Email
                    </Button>
                  </div>
                )}
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

            <div className="row">
              <div className="col-12">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={handleChange("date_of_birth")}
                  error={formErrors.date_of_birth}
                />
              </div>
            </div>

            <Input
              label="Bio / About (optional)"
              as="textarea"
              value={form.bio}
              onChange={handleChange("bio")}
            />

            <div className="d-flex justify-content-end mt-auto pt-2">
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