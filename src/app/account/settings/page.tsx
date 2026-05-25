"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import CloudinaryImageUploader from "@/components/CloudinaryImageUploader";
import { useLanguage } from "@/lib/LanguageContext";
import { useToast } from "@/lib/ToastContext";

type ProfileState = {
  name: string;
  email: string;
  phone: string;
  image: string;
};

const emptyProfile: ProfileState = {
  name: "",
  email: "",
  phone: "",
  image: "",
};

export default function AccountSettingsPage() {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<ProfileState>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/account/profile", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          addToast(data.error || t("profile_load_failed"), "error");
          return;
        }

        setProfile({
          name: data.user?.name || "",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
          image: data.user?.image || "",
        });
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [addToast, t]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          image: profile.image,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        addToast(data.error || t("profile_save_failed"), "error");
        return;
      }

      setProfile((current) => ({
        ...current,
        name: data.user?.name || current.name,
        phone: data.user?.phone || current.phone,
        image: data.user?.image || current.image,
      }));
      addToast(t("profile_saved"), "success");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
        <h1>{t("settings")}</h1>
        <p className="mt-2 text-[14px] text-text-muted">
          {t("account_settings_intro")}
        </p>
      </div>

      <div className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
        {loading ? (
          <p className="text-[14px] text-text-muted">{t("loading_profile")}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-fb-pink-bg">
                {profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.image} alt={profile.name || t("profile")} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-fb-pink" />
                )}
              </div>
              <div className="mt-4">
	                <CloudinaryImageUploader
	                  buttonLabel={t("upload_profile_photo")}
	                  multiple={false}
	                  enableCamera
	                  onUploaded={(urls) => setProfile((current) => ({ ...current, image: urls[0] || current.image }))}
	                />
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("full_name")}</label>
                <input
                  value={profile.name}
                  onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("email")}</label>
                <input value={profile.email} disabled className="cursor-not-allowed bg-[var(--bg-surface)]" />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("phone_number")}</label>
                <input
                  value={profile.phone}
                  onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("profile_image_url")}</label>
                <input
                  value={profile.image}
                  onChange={(event) => setProfile((current) => ({ ...current, image: event.target.value }))}
                />
              </div>
              <div>
                <button type="button" onClick={saveProfile} className="btn-primary" disabled={saving}>
                  {saving ? t("saving") : t("save_profile")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
