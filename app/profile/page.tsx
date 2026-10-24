"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EscolaLMSContext } from "@escolalms/sdk/lib/react/context";
import { Nav } from "../components/Nav";
import { useToast } from "../components/Toast";
import { useFormat, useT } from "../i18n/I18nProvider";
import type { API } from "@escolalms/sdk/lib";

function SectionFeedback({ success, error }: { success: string; error: string }) {
  if (success) return <p className="text-sm text-[#1abc9c]">{success}</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  return null;
}

export default function ProfilePage() {
  const { user, fetchProfile, updateProfile, changePassword, updateAvatar, fetchMyProducts, cancelSubscription } =
    useContext(EscolaLMSContext);
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();
  const { date } = useFormat();
  const tp = t.learner.profile;
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

  // Subscriptions
  const [myProducts, setMyProducts] = useState<API.Product[]>([]);
  const [subCancelling, setSubCancelling] = useState<number | null>(null);

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
    fetchMyProducts({}).then((res: any) => {
      setMyProducts(res?.data ?? []);
    });
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
        setDetailsSuccess(tp.profileUpdated);
      } else {
        setDetailsError(tp.profileFailed);
      }
    } catch {
      setDetailsError(tp.profileFailed);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwdSuccess("");
    setPwdError("");
    if (pwd.new_password !== pwd.new_confirm_password) {
      setPwdError(tp.passwordsDontMatch);
      return;
    }
    if (pwd.new_password.length < 8) {
      setPwdError(tp.passwordTooShort);
      return;
    }
    setPwdLoading(true);
    try {
      const res = await changePassword(pwd);
      if (res.success) {
        setPwdSuccess(tp.passwordChanged);
        setPwd({ current_password: "", new_password: "", new_confirm_password: "" });
      } else {
        setPwdError((res as any)?.data?.message || tp.incorrectPassword);
      }
    } catch {
      setPwdError(tp.passwordFailed);
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
        setAvatarSuccess(tp.avatarUpdated);
      } else {
        setAvatarError(tp.avatarFailed);
      }
    } catch {
      setAvatarError(tp.avatarFailed);
    } finally {
      setAvatarLoading(false);
    }
  }

  const handleCancelSubscription = useCallback(async (productId: number) => {
    setSubCancelling(productId);
    try {
      await cancelSubscription(productId);
      setMyProducts((prev) => prev.filter((p) => Number(p.id) !== productId));
      toast(tp.subscriptionCancelled);
    } catch {
      toast(tp.subscriptionCancelFailed, "error");
    } finally {
      setSubCancelling(null);
    }
  }, [cancelSubscription, toast, tp]);

  const activeSubscriptions = myProducts.filter((p) => p.subscription_period);

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]";
  const labelClass = "block text-sm font-medium text-[#04323e] mb-1";

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-12 space-y-10">
        <h1 className="text-3xl font-bold text-[#04323e]">{tp.title}</h1>

        {/* Avatar */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#04323e] mb-5">{tp.photo}</h2>
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              {avatarPreview || (u as any).avatar ? (
                <img
                  src={avatarPreview ?? (u as any).avatar}
                  alt={tp.avatarAlt}
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
                {tp.choosePhoto}
              </label>
              {avatarPreview && (
                <button
                  onClick={handleAvatarUpload}
                  disabled={avatarLoading}
                  className="block bg-[#1abc9c] hover:bg-[#15a288] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                >
                  {avatarLoading ? tp.uploading : tp.savePhoto}
                </button>
              )}
              <SectionFeedback success={avatarSuccess} error={avatarError} />
            </div>
          </div>
        </section>

        {/* Personal details */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#04323e] mb-5">{tp.personalDetails}</h2>
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{tp.firstName}</label>
                <input
                  type="text"
                  value={details.first_name}
                  onChange={(e) => setDetails((d) => ({ ...d, first_name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{tp.lastName}</label>
                <input
                  type="text"
                  value={details.last_name}
                  onChange={(e) => setDetails((d) => ({ ...d, last_name: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>{tp.phone}</label>
              <input
                type="tel"
                value={details.phone}
                onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{tp.country}</label>
                <input
                  type="text"
                  value={details.country}
                  onChange={(e) => setDetails((d) => ({ ...d, country: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{tp.city}</label>
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
              {detailsLoading ? t.common.saving : tp.saveChanges}
            </button>
          </form>
        </section>

        {/* Subscriptions */}
        {activeSubscriptions.length > 0 && (
          <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#04323e] mb-5">{tp.subscriptions}</h2>
            <ul className="space-y-4">
              {activeSubscriptions.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-[#04323e]">{p.name}</p>
                    <p className="text-sm text-gray-400">
                      {tp.renews(String(p.subscription_period))}
                      {p.end_date && tp.expires(date(p.end_date))}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelSubscription(Number(p.id))}
                    disabled={subCancelling === Number(p.id)}
                    className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {subCancelling === Number(p.id) ? tp.cancelling : tp.cancelSubscription}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Change password */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#04323e] mb-5">{tp.changePassword}</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>{tp.currentPassword}</label>
              <input
                type="password"
                value={pwd.current_password}
                onChange={(e) => setPwd((p) => ({ ...p, current_password: e.target.value }))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{tp.newPassword}</label>
              <input
                type="password"
                value={pwd.new_password}
                onChange={(e) => setPwd((p) => ({ ...p, new_password: e.target.value }))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{tp.confirmNewPassword}</label>
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
              {pwdLoading ? tp.updating : tp.updatePassword}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
