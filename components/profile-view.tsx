"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import LogoutButton from "@/components/logout-button";
import LoadingBar from "@/components/ui/loading-bar";

type ProfileUser = {
  id: number;
  name: string;
  email: string;
};

type ProfileResponse = {
  success?: boolean;
  message?: string;
  data?: ProfileUser;
};

export default function ProfileView() {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

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
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (response.status === 401) {
          sessionStorage.removeItem("auth_token");
          router.replace("/login");
          return;
        }

        const result = (await response.json()) as ProfileResponse;

        if (!response.ok || !result.success || !result.data) {
          throw new Error("Profile request failed");
        }

        setUser(result.data);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, [attempt, router]);

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-5 sm:px-6 space-y-4" role="status" aria-busy="true">
        <LoadingBar />
        <div className="space-y-2">
          <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-7 w-32 rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="rounded-xl border border-border/80 bg-surface p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-36 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-3.5 w-48 rounded-full bg-slate-200 animate-pulse" />
            </div>
          </div>
          <div className="pt-4 border-t border-border/60 space-y-4">
            <div className="h-4 w-40 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-10 w-28 rounded-lg bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "error" || !user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-7 @sm/app:px-8 @sm/app:py-9">
        <div className="rounded-md border border-border bg-surface p-6" role="alert">
          <p className="text-sm text-foreground">{t("loadError")}</p>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            onClick={() => {
              setStatus("loading");
              setAttempt((current) => current + 1);
            }}
            type="button"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-7 @sm/app:px-8 @sm/app:py-9">
      <div className="mb-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          KasKu
        </p>
        <h2 className="text-2xl font-semibold @sm/app:text-[28px]">{t("title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <section className="rounded-md border border-border bg-surface p-5 @sm/app:p-6">
        <dl className="grid gap-5 @sm/app:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted">{t("fullName")}</dt>
            <dd className="mt-1 text-base font-semibold text-foreground">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">{t("email")}</dt>
            <dd className="mt-1 break-all text-base font-semibold text-foreground">
              {user.email}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-border pt-5">
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}