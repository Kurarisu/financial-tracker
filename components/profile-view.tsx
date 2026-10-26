"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ChevronRight, Download, LockKeyhole, ShieldAlert, Trash2, UserRound, type LucideIcon } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import LogoutButton from "@/components/logout-button";
import LoadingBar from "@/components/ui/loading-bar";

type ProfileUser = { id: number; name: string; email: string };
type ApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};

function getErrorMessage(result: ApiResponse, fallback: string) {
  return Object.values(result.errors ?? {}).flat()[0] ?? result.message ?? fallback;
}

function ProfileActionRow({
  icon: Icon,
  title,
  description,
  onClick,
  expanded,
  controls,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  expanded: boolean;
  controls: string;
}) {
  return (
    <button
      aria-controls={controls}
      aria-expanded={expanded}
      className="flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-150 hover:bg-background active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      onClick={onClick}
      type="button"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">{description}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
    </button>
  );
}

export default function ProfileView() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [deletePassword, setDeletePassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("auth_token");

    if (!token) {
      router.replace("/login");
      return () => controller.abort();
    }

    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (response.status === 401) {
          sessionStorage.removeItem("auth_token");
          router.replace("/login");
          return;
        }
        const result = (await response.json()) as ApiResponse<ProfileUser>;
        if (!response.ok || !result.success || !result.data) throw new Error(t("loadError"));
        setUser(result.data);
        setProfileForm({ name: result.data.name, email: result.data.email });
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, [attempt, router, t]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: profileForm.name.trim(), email: profileForm.email.trim().toLowerCase() }),
      });
      if (response.status === 401) {
        sessionStorage.removeItem("auth_token");
        router.replace("/login");
        return;
      }
      const result = (await response.json()) as ApiResponse<ProfileUser>;
      if (!response.ok || !result.success || !result.data) throw new Error(getErrorMessage(result, t("profileUpdateError")));
      setUser(result.data);
      setProfileForm({ name: result.data.name, email: result.data.email });
      setEditingProfile(false);
      setProfileMessage(t("profileSaved"));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : t("profileUpdateError"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setSavingPassword(true);
    setPasswordError("");
    setPasswordMessage("");
    try {
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(passwordForm),
      });
      if (response.status === 401) {
        sessionStorage.removeItem("auth_token");
        router.replace("/login");
        return;
      }
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.success) throw new Error(getErrorMessage(result, t("passwordUpdateError")));
      setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
      setChangingPassword(false);
      setPasswordMessage(t("passwordSaved"));
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : t("passwordUpdateError"));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setSavingDelete(true);
    setDeleteError("");
    try {
      const response = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (response.status === 401) {
        sessionStorage.removeItem("auth_token");
        router.replace("/login");
        return;
      }
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.success) throw new Error(getErrorMessage(result, t("deleteError")));
      sessionStorage.removeItem("auth_token");
      router.replace("/login");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : t("deleteError"));
    } finally {
      setSavingDelete(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-5 py-7 @sm/app:px-8 @sm/app:py-9" role="status" aria-busy="true">
        <LoadingBar />
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-36 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (status === "error" || !user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-7 @sm/app:px-8 @sm/app:py-9">
        <div className="rounded-xl border border-border bg-surface p-6" role="alert">
          <p className="text-sm text-foreground">{t("loadError")}</p>
          <button className="mt-4 inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover" onClick={() => { setStatus("loading"); setAttempt((current) => current + 1); }} type="button">{t("retry")}</button>
        </div>
      </div>
    );
  }

  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  function handleLanguageChange(nextLocale: "en" | "id") {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-5 py-6 @sm/app:px-8 @sm/app:py-8">
      <header>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">KasKu</p>
        <h2 className="text-2xl font-semibold @sm/app:text-[28px]">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        <div className="mt-5 flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm @sm/app:gap-4 @sm/app:p-5">
          <div aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base font-bold text-primary @sm/app:size-14 @sm/app:text-lg">{initials || <UserRound className="size-6" />}</div>
          <div className="min-w-0 flex-1"><h3 className="truncate text-base font-semibold text-foreground @sm/app:text-lg">{user.name}</h3><p className="truncate text-xs text-muted @sm/app:text-sm">{user.email}</p></div>
          <div className="shrink-0">
            <LogoutButton />
          </div>
        </div>
      </header>

      <section aria-labelledby="profile-account-heading">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted" id="profile-account-heading">{t("sectionAccount")}</h3>
        <div className="space-y-3">
          <section className="rounded-2xl border border-border bg-surface p-2 shadow-sm">
            <ProfileActionRow icon={UserRound} title={t("personalInfo")} description={t("personalInfoDescription")} expanded={editingProfile} controls="profile-edit-form" onClick={() => { if (editingProfile) setProfileForm({ name: user.name, email: user.email }); setEditingProfile((open) => !open); setProfileError(""); setProfileMessage(""); }} />
            {profileMessage && <p className="mx-2 mt-2 rounded-md bg-income/10 px-3 py-2 text-sm text-income" role="status">{profileMessage}</p>}
            {editingProfile && (
              <form className="space-y-4 border-t border-border px-3 pb-3 pt-4" id="profile-edit-form" onSubmit={handleProfileSubmit}>
                {profileError && <p className="rounded-md bg-expense/10 px-3 py-2 text-sm text-expense" role="alert">{profileError}</p>}
                <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{t("fullName")}</span><input autoComplete="name" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" maxLength={255} onChange={(event) => setProfileForm((form) => ({ ...form, name: event.target.value }))} required value={profileForm.name} /></label>
                <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{t("email")}</span><input autoComplete="email" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" onChange={(event) => setProfileForm((form) => ({ ...form, email: event.target.value }))} required type="email" value={profileForm.email} /></label>
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60" disabled={savingProfile} type="submit">{savingProfile ? t("saving") : t("saveChanges")}</button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-2 shadow-sm">
            <ProfileActionRow icon={LockKeyhole} title={t("securityTitle")} description={t("securityDescription")} expanded={changingPassword} controls="profile-password-form" onClick={() => { if (changingPassword) setPasswordForm({ current_password: "", password: "", password_confirmation: "" }); setChangingPassword((open) => !open); setPasswordError(""); setPasswordMessage(""); }} />
            {passwordMessage && <p className="mx-2 mt-2 rounded-md bg-income/10 px-3 py-2 text-sm text-income" role="status">{passwordMessage}</p>}
            {changingPassword && (
              <form className="space-y-4 border-t border-border px-3 pb-3 pt-4" id="profile-password-form" onSubmit={handlePasswordSubmit}>
                {passwordError && <p className="rounded-md bg-expense/10 px-3 py-2 text-sm text-expense" role="alert">{passwordError}</p>}
                <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{t("currentPassword")}</span><input autoComplete="current-password" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" onChange={(event) => setPasswordForm((form) => ({ ...form, current_password: event.target.value }))} required type="password" value={passwordForm.current_password} /></label>
                <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{t("newPassword")}</span><input autoComplete="new-password" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" minLength={8} onChange={(event) => setPasswordForm((form) => ({ ...form, password: event.target.value }))} required type="password" value={passwordForm.password} /></label>
                <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{t("confirmPassword")}</span><input autoComplete="new-password" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" onChange={(event) => setPasswordForm((form) => ({ ...form, password_confirmation: event.target.value }))} required type="password" value={passwordForm.password_confirmation} /></label>
                <button className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60" disabled={savingPassword} type="submit">{savingPassword ? t("saving") : t("saveChanges")}</button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-expense/30 bg-surface p-4 shadow-sm @sm/app:p-5">
          <div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-expense/10 text-expense"><ShieldAlert aria-hidden="true" className="size-5" /></span><div><h3 className="font-semibold text-foreground">{t("deleteTitle")}</h3><p className="mt-1 text-sm text-muted">{t("deleteDescription")}</p></div></div>
          {!deletingAccount ? (
            <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-expense/40 px-4 text-sm font-semibold text-expense hover:bg-expense/5" onClick={() => { setDeletingAccount(true); setDeleteError(""); }} type="button"><Trash2 aria-hidden="true" className="size-4" />{t("deleteAccount")}</button>
          ) : (
            <form className="mt-4 space-y-3 border-t border-expense/20 pt-4" onSubmit={handleDeleteSubmit}>
              <p className="text-sm font-medium text-expense" role="alert">{t("deleteWarning")}</p>
              {deleteError && <p className="rounded-md bg-expense/10 px-3 py-2 text-sm text-expense" role="alert">{deleteError}</p>}
              <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{t("confirmWithPassword")}</span><input autoComplete="current-password" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-expense/30" onChange={(event) => setDeletePassword(event.target.value)} required type="password" value={deletePassword} /></label>
              <div className="flex flex-wrap gap-2"><button className="inline-flex h-10 items-center justify-center rounded-md bg-expense px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60" disabled={savingDelete} type="submit">{savingDelete ? t("deleting") : t("confirmDelete")}</button><button className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-background" disabled={savingDelete} onClick={() => { setDeletingAccount(false); setDeletePassword(""); setDeleteError(""); }} type="button">{t("cancel")}</button></div>
            </form>
          )}
          </section>
        </div>
      </section>

      <section aria-labelledby="profile-data-heading">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted" id="profile-data-heading">{t("sectionData")}</h3>
        <Link className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm transition-colors duration-150 hover:bg-background active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/reports">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Download aria-hidden="true" className="size-5" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{t("dataTitle")}</span><span className="mt-0.5 block truncate text-xs text-muted">{t("dataDescription")}</span></span>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" />
        </Link>
      </section>

      <section aria-labelledby="profile-preferences-heading">
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted" id="profile-preferences-heading">{t("sectionPreferences")}</h3>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm @sm/app:flex-row @sm/app:items-center @sm/app:justify-between @sm/app:p-5">
          <div className="min-w-0"><h4 className="text-sm font-semibold text-foreground">{t("preferencesTitle")}</h4><p className="mt-1 text-sm text-muted">{t("preferencesDescription")}</p></div>
          <fieldset className="shrink-0">
            <legend className="sr-only">{t("language")}</legend>
            <div aria-label={t("language")} className="inline-flex rounded-lg border border-border bg-background p-1" role="group">
              {(["en", "id"] as const).map((option) => (
                <button aria-pressed={locale === option} className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${locale === option ? "bg-primary text-white" : "text-muted hover:text-foreground"}`} key={option} onClick={() => handleLanguageChange(option)} type="button">{t(option === "en" ? "english" : "indonesian")}</button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>
    </div>
  );
}
