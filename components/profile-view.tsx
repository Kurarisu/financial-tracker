"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Download, LockKeyhole, ShieldAlert, Trash2, UserRound } from "lucide-react";
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
    <div className="mx-auto w-full max-w-3xl px-5 py-7 @sm/app:px-8 @sm/app:py-9">
      <header className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">KasKu</p>
        <h2 className="text-2xl font-semibold @sm/app:text-[28px]">{t("title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
      </header>

      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm @sm/app:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">{initials || <UserRound className="size-6" />}</div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-foreground">{user.name}</h3>
                <p className="break-all text-sm text-muted">{user.email}</p>
              </div>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground">{t("personalInfo")}</h4>
              <p className="mt-1 text-xs text-muted">{t("personalInfoDescription")}</p>
            </div>
            <button className="shrink-0 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-background" onClick={() => { if (editingProfile) setProfileForm({ name: user.name, email: user.email }); setEditingProfile((open) => !open); setProfileError(""); setProfileMessage(""); }} type="button">{editingProfile ? t("cancel") : t("editProfile")}</button>
          </div>

          {profileMessage && <p className="mt-4 rounded-md bg-income/10 px-3 py-2 text-sm text-income" role="status">{profileMessage}</p>}
          {editingProfile && (
            <form className="mt-4 space-y-4" onSubmit={handleProfileSubmit}>
              {profileError && <p className="rounded-md bg-expense/10 px-3 py-2 text-sm text-expense" role="alert">{profileError}</p>}
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                <span>{t("fullName")}</span>
                <input autoComplete="name" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" maxLength={255} onChange={(event) => setProfileForm((form) => ({ ...form, name: event.target.value }))} required value={profileForm.name} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                <span>{t("email")}</span>
                <input autoComplete="email" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" onChange={(event) => setProfileForm((form) => ({ ...form, email: event.target.value }))} required type="email" value={profileForm.email} />
              </label>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60" disabled={savingProfile} type="submit">{savingProfile ? t("saving") : t("saveChanges")}</button>
            </form>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm @sm/app:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><LockKeyhole aria-hidden="true" className="size-5" /></span>
              <div><h3 className="font-semibold text-foreground">{t("securityTitle")}</h3><p className="mt-1 text-sm text-muted">{t("securityDescription")}</p></div>
            </div>
            <button className="shrink-0 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-background" onClick={() => { if (changingPassword) setPasswordForm({ current_password: "", password: "", password_confirmation: "" }); setChangingPassword((open) => !open); setPasswordError(""); setPasswordMessage(""); }} type="button">{changingPassword ? t("cancel") : t("changePassword")}</button>
          </div>
          {passwordMessage && <p className="mt-4 rounded-md bg-income/10 px-3 py-2 text-sm text-income" role="status">{passwordMessage}</p>}
          {changingPassword && (
            <form className="mt-4 space-y-4 border-t border-border pt-4" onSubmit={handlePasswordSubmit}>
              {passwordError && <p className="rounded-md bg-expense/10 px-3 py-2 text-sm text-expense" role="alert">{passwordError}</p>}
              <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{t("currentPassword")}</span><input autoComplete="current-password" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" onChange={(event) => setPasswordForm((form) => ({ ...form, current_password: event.target.value }))} required type="password" value={passwordForm.current_password} /></label>
              <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{t("newPassword")}</span><input autoComplete="new-password" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" minLength={8} onChange={(event) => setPasswordForm((form) => ({ ...form, password: event.target.value }))} required type="password" value={passwordForm.password} /></label>
              <label className="block space-y-1.5 text-sm font-medium text-foreground"><span>{t("confirmPassword")}</span><input autoComplete="new-password" className="h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" onChange={(event) => setPasswordForm((form) => ({ ...form, password_confirmation: event.target.value }))} required type="password" value={passwordForm.password_confirmation} /></label>
              <button className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60" disabled={savingPassword} type="submit">{savingPassword ? t("saving") : t("saveChanges")}</button>
            </form>
          )}
        </section>

        <section className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm @sm/app:p-6">
          <div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><Download aria-hidden="true" className="size-5" /></span><div><h3 className="font-semibold text-foreground">{t("dataTitle")}</h3><p className="mt-1 text-sm text-muted">{t("dataDescription")}</p></div></div>
          <Link className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm font-semibold text-primary hover:bg-primary/5" href="/reports">{t("openReports")}<ArrowRight aria-hidden="true" className="size-4" /></Link>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm @sm/app:p-6">
          <div><h3 className="font-semibold text-foreground">{t("preferencesTitle")}</h3><p className="mt-1 text-sm text-muted">{t("preferencesDescription")}</p></div>
          <fieldset>
            <legend className="sr-only">{t("language")}</legend>
            <div aria-label={t("language")} className="inline-flex rounded-lg border border-border bg-background p-1" role="group">
              {(["en", "id"] as const).map((option) => (
                <button aria-pressed={locale === option} className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${locale === option ? "bg-primary text-white" : "text-muted hover:text-foreground"}`} key={option} onClick={() => handleLanguageChange(option)} type="button">
                  {t(option === "en" ? "english" : "indonesian")}
                </button>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="rounded-xl border border-expense/30 bg-surface p-5 shadow-sm @sm/app:p-6">
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
    </div>
  );
}
