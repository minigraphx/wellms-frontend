"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../components/Nav";

function SectionFeedback({ success, error }: { success: string; error: string }) {
  if (success) return <p className="text-sm text-[#1abc9c]">{success}</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  return null;
}

export default function ProfilePage() {
  const { user, fetchProfile, updateProfile, changePassword, updateAvatar } =
    useContext(EscolaLMSContext);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Personal details
  const [details, setDetails] = useState({ first_name: "", last_name: "", phone: "", country: "", city: "" });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState("");
  const [detailsError, setDetailsError] = useState("");

  // Change password
  const [pwd, setPwd] = useState({ current_password: "", new_password: "", new_confirm_password: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdError, setPwdError] = useState("");

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user.value) {
      router.push("/");
      return;
    }
    fetchProfile();
  }, [mounted, user.value]);

  // Populate form once user data loads
  useEffect(() => {
    if (!user.value) return;
    const u = user.value;
    setDetails({
      first_name: u.first_name ?? "",
      last_name: u.last_name ?? "",
      phone: (u as any).phone ?? "",
      country: (u as any).country ?? "",
      city: (u as any).city ?? "",
    });
  }, [user.value]);

  if (!mounted || !user.value) return null;

  const u = user.value;
  const initials = `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase();

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDetailsSuccess("");
    setDetailsError("");
    setDetailsLoading(true);
    try {
      const res = await updateProfile(details);
      if (res.success) {
        setDetailsSuccess("Profile updated.");
      } else {
        setDetailsError("Failed to update profile.");
      }
    } catch {
      setDetailsError("Failed to update profile.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwdSuccess("");
    setPwdError("");
    if (pwd.new_password !== pwd.new_confirm_password) {
      setPwdError("Passwords do not match.");
      return;
    }
    if (pwd.new_password.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }
    setPwdLoading(true);
    try {
      const res = await changePassword(pwd);
      if (res.success) {
        setPwdSuccess("Password changed.");
        setPwd({ current_password: "", new_password: "", new_confirm_password: "" });
      } else {
        setPwdError((res as any)?.data?.message || "Incorrect current password.");
      }
    } catch {
      setPwdError("Failed to change password.");
    } finally {
      setPwdLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleAvatarUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setAvatarSuccess("");
    setAvatarError("");
    setAvatarLoading(true);
    try {
      const res = await updateAvatar(file);
      if (res.success) {
        setAvatarSuccess("Avatar updated.");
      } else {
        setAvatarError("Failed to upload avatar.");
      }
    } catch {
      setAvatarError("Failed to upload avatar.");
    } finally {
      setAvatarLoading(false);
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]";
  const labelClass = "block text-sm font-medium text-[#04323e] mb-1";

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-12 space-y-10">
        <h1 className="text-3xl font-bold text-[#04323e]">Profile</h1>

        {/* Avatar */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#04323e] mb-5">Photo</h2>
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              {avatarPreview || (u as any).avatar ? (
                <img
                  src={avatarPreview ?? (u as any).avatar}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#1abc9c]/10 text-[#1abc9c] flex items-center justify-center text-2xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="avatar-input"
              />
              <label
                htmlFor="avatar-input"
                className="inline-block cursor-pointer border border-gray-200 text-sm font-medium text-[#555555] hover:border-[#1abc9c] hover:text-[#1abc9c] px-4 py-2 rounded-full transition-colors"
              >
                Choose photo
              </label>
              {avatarPreview && (
                <button
                  onClick={handleAvatarUpload}
                  disabled={avatarLoading}
                  className="block bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                >
                  {avatarLoading ? "Uploading…" : "Save photo"}
                </button>
              )}
              <SectionFeedback success={avatarSuccess} error={avatarError} />
            </div>
          </div>
        </section>

        {/* Personal details */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#04323e] mb-5">Personal details</h2>
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  type="text"
                  value={details.first_name}
                  onChange={(e) => setDetails((d) => ({ ...d, first_name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  type="text"
                  value={details.last_name}
                  onChange={(e) => setDetails((d) => ({ ...d, last_name: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                value={details.phone}
                onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Country</label>
                <input
                  type="text"
                  value={details.country}
                  onChange={(e) => setDetails((d) => ({ ...d, country: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  value={details.city}
                  onChange={(e) => setDetails((d) => ({ ...d, city: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <SectionFeedback success={detailsSuccess} error={detailsError} />
            <button
              type="submit"
              disabled={detailsLoading}
              className="bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
            >
              {detailsLoading ? "Saving…" : "Save changes"}
            </button>
          </form>
        </section>

        {/* Change password */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#04323e] mb-5">Change password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Current password</label>
              <input
                type="password"
                value={pwd.current_password}
                onChange={(e) => setPwd((p) => ({ ...p, current_password: e.target.value }))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={pwd.new_password}
                onChange={(e) => setPwd((p) => ({ ...p, new_password: e.target.value }))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={pwd.new_confirm_password}
                onChange={(e) => setPwd((p) => ({ ...p, new_confirm_password: e.target.value }))}
                required
                className={inputClass}
              />
            </div>
            <SectionFeedback success={pwdSuccess} error={pwdError} />
            <button
              type="submit"
              disabled={pwdLoading}
              className="bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
            >
              {pwdLoading ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
