"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import LoadingBar from "@/components/ui/loading-bar";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Link from "next/link";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money-input";

const accountTypes = [
  { value: "bank", labelKey: "typeBank" },
  { value: "ewallet", labelKey: "typeEwallet" },
  { value: "cash", labelKey: "typeCash" },
  { value: "investment", labelKey: "typeInvestment" },
  { value: "other", labelKey: "typeOther" },
] as const;

const initialForm = {
  name: "",
  type: "cash",
  account_number: "",
  initial_balance: "",
  color: "#10B981",
  icon: "coins",
};

export default function AccountForm() {
  const t = useTranslations("Accounts");
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("auth_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      account_number: form.account_number.trim() || null,
      initial_balance: form.initial_balance
        ? parseMoneyInput(form.initial_balance)
        : 0,
      color: form.color,
      icon: form.icon,
      is_active: true,
    };

    if (!payload.name) {
      setError(t("validationName"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.errors
            ? Object.values(result.errors).flat().join(" ")
            : result.message ?? "Unable to save account.",
        );
      }

      const isOnboarding =
        new URLSearchParams(window.location.search).get("onboarding") === "true";
      router.replace(isOnboarding ? "/" : "/accounts");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[820px] px-5 py-7 @sm/app:px-8 @sm/app:py-9">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {t("workspace")}
          </p>
          <h2 className="text-2xl font-semibold tracking-normal @sm/app:text-[28px]">
            {t("newAccount")}
          </h2>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground"
          href="/accounts"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("back")}
        </Link>
      </div>

      <form className="space-y-5 rounded-md border border-border bg-surface p-5 @sm/app:p-6" onSubmit={handleSubmit}>
        {saving && <LoadingBar className="mb-2" />}
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 @md/app:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("name")}</span>
            <input
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              onChange={(event) => updateField("name", event.target.value)}
              value={form.name}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("accountType")}</span>
            <select
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              onChange={(event) => updateField("type", event.target.value)}
              value={form.type}
            >
              {accountTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {t(type.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 @md/app:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("accountNumber")}</span>
            <input
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              onChange={(event) => updateField("account_number", event.target.value)}
              value={form.account_number}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("initialBalance")}</span>
            <input
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              inputMode="decimal"
              onChange={(event) =>
                updateField("initial_balance", formatMoneyInput(event.target.value))
              }
              type="text"
              value={form.initial_balance}
            />
          </label>
        </div>

        <div className="grid gap-5 @md/app:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("color")}</span>
            <input
              className="h-11 w-full rounded-md border border-border bg-background px-2 text-sm outline-none"
              onChange={(event) => updateField("color", event.target.value)}
              type="color"
              value={form.color}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("icon")}</span>
            <input
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              onChange={(event) => updateField("icon", event.target.value)}
              value={form.icon}
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground"
            href="/accounts"
          >
            {t("cancel")}
          </Link>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            disabled={saving}
            type="submit"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? t("saving") : t("saveAccount")}
          </button>
        </div>
      </form>
    </div>
  );
}
