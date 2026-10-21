"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import LoadingBar from "@/components/ui/loading-bar";

type AuthMode = "login" | "register";

type AuthApiResponse = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: {
    token?: string;
  };
};

type AccountsApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    accounts?: { id: number; name: string; type: string }[];
  };
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(formData.get("password_confirmation") ?? "");

    if (isRegister && password !== passwordConfirmation) {
      setError(t("passwordMismatch"));
      return;
    }

    const payload = isRegister
      ? {
          name: String(formData.get("name") ?? ""),
          email,
          password,
          password_confirmation: passwordConfirmation,
        }
      : { email, password };

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${mode}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as AuthApiResponse;

      if (!response.ok || !result.success) {
        const validationMessage = Object.values(result.errors ?? {}).flat()[0];
        setError(validationMessage ?? result.message ?? t("requestFailed"));
        return;
      }

      if (!result.data?.token) {
        setError(t("invalidResponse"));
        return;
      }

      const accountsResponse = await fetch("/api/accounts", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${result.data.token}`,
        },
        cache: "no-store",
      });
      const accountsResult = (await accountsResponse.json()) as AccountsApiResponse;

      if (!accountsResponse.ok || !accountsResult.success || !accountsResult.data) {
        throw new Error(accountsResult.message ?? t("requestFailed"));
      }

      const accounts = Array.isArray(accountsResult.data.accounts)
        ? accountsResult.data.accounts
        : [];
      const hasAccounts = accounts.length > 0;
      const hasCashAccount = accounts.some((account) => account.type === "cash");

      sessionStorage.setItem("auth_token", result.data.token);
      router.replace(
        isRegister && hasCashAccount
          ? { pathname: "/accounts/new", query: { onboarding: "true", setupCash: "true" } }
          : isRegister
            ? { pathname: "/accounts/new", query: { onboarding: "true" } }
            : hasAccounts
              ? "/"
              : { pathname: "/accounts/new", query: { onboarding: "true" } },
      );
    } catch {
      setError(t("requestFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm @sm/app:p-8">
        {isSubmitting && <LoadingBar className="mb-4" />}
        <div className="mb-8">
          <img
            alt="KasKu logo"
            className="mb-4 h-auto w-24"
            src="/images/logo-no-bg.png"
          />
          <h1 className="text-2xl font-semibold text-foreground">
            {isRegister ? t("registerTitle") : t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isRegister ? t("registerSubtitle") : t("subtitle")}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {isRegister && (
            <label className="block space-y-2 text-sm font-medium text-foreground">
              <span>{t("nameLabel")}</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted"
                placeholder={t("namePlaceholder")}
              />
            </label>
          )}

          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>{t("emailLabel")}</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted"
              placeholder={t("emailPlaceholder")}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>{t("passwordLabel")}</span>
            <input
              type="password"
              name="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? 8 : undefined}
              required
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted"
              placeholder={t("passwordPlaceholder")}
            />
          </label>

          {isRegister && (
            <label className="block space-y-2 text-sm font-medium text-foreground">
              <span>{t("confirmPasswordLabel")}</span>
              <input
                type="password"
                name="password_confirmation"
                autoComplete="new-password"
                minLength={8}
                required
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted"
                placeholder={t("confirmPasswordPlaceholder")}
              />
            </label>
          )}

          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting
              ? t(isRegister ? "creatingAccount" : "signingIn")
              : t(isRegister ? "createAccount" : "signIn")}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {isRegister ? t("alreadyHaveAccount") : t("noAccount")} {" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-medium text-primary hover:underline"
          >
            {isRegister ? t("signIn") : t("registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
