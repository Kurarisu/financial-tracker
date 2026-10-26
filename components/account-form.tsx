"use client";

import { Banknote, BriefcaseBusiness, Check, CircleDollarSign, Coins, CreditCard, Landmark, Loader2, PiggyBank, Smartphone, Vault, Wallet, type LucideIcon } from "lucide-react";
import LoadingBar from "@/components/ui/loading-bar";
import PageHeader from "@/components/ui/page-header";
import { useRef, useState, type KeyboardEvent } from "react";
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

const accountIcons: { value: string; icon: LucideIcon; labelKey: string }[] = [
  { value: "coins", icon: Coins, labelKey: "iconCoins" },
  { value: "landmark", icon: Landmark, labelKey: "iconLandmark" },
  { value: "wallet", icon: Wallet, labelKey: "iconWallet" },
  { value: "credit-card", icon: CreditCard, labelKey: "iconCreditCard" },
  { value: "piggy-bank", icon: PiggyBank, labelKey: "iconPiggyBank" },
  { value: "smartphone", icon: Smartphone, labelKey: "iconSmartphone" },
  { value: "banknote", icon: Banknote, labelKey: "iconBanknote" },
  { value: "briefcase", icon: BriefcaseBusiness, labelKey: "iconBriefcase" },
  { value: "circle-dollar-sign", icon: CircleDollarSign, labelKey: "iconInvestment" },
  { value: "vault", icon: Vault, labelKey: "iconVault" },
];

const accountColors = [
  { value: "#2563EB", labelKey: "colorBlue" },
  { value: "#0D9488", labelKey: "colorTeal" },
  { value: "#10B981", labelKey: "colorGreen" },
  { value: "#A855F7", labelKey: "colorPurple" },
  { value: "#E11D48", labelKey: "colorRose" },
  { value: "#EA580C", labelKey: "colorOrange" },
  { value: "#64748B", labelKey: "colorSlate" },
  { value: "#D97706", labelKey: "colorAmber" },
  { value: "#06B6D4", labelKey: "colorCyan" },
  { value: "#22C55E", labelKey: "colorLime" },
];

const typeDefaults: Record<string, { icon: string; color: string }> = {
  bank: { icon: "landmark", color: "#2563EB" },
  ewallet: { icon: "smartphone", color: "#A855F7" },
  cash: { icon: "coins", color: "#10B981" },
  investment: { icon: "circle-dollar-sign", color: "#0D9488" },
  other: { icon: "wallet", color: "#64748B" },
};

const initialForm = {
  name: "",
  type: "cash",
  account_number: "",
  initial_balance: "",
  color: typeDefaults.cash.color,
  icon: "coins",
};

export default function AccountForm() {
  const t = useTranslations("Accounts");
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const typeButtons = useRef(new Map<string, HTMLButtonElement>());
  const iconButtons = useRef(new Map<string, HTMLButtonElement>());
  const colorButtons = useRef(new Map<string, HTMLButtonElement>());

  function handleRadioKeyDown(event: KeyboardEvent<HTMLButtonElement>, values: string[], current: string, group: "type" | "icon" | "color") {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = values[(values.indexOf(current) + step + values.length) % values.length];
    if (group === "type") {
      const defaults = typeDefaults[next];
      setForm((state) => ({ ...state, type: next, icon: defaults.icon, color: defaults.color }));
      typeButtons.current.get(next)?.focus();
    } else if (group === "icon") {
      updateField("icon", next);
      iconButtons.current.get(next)?.focus();
    } else {
      updateField("color", next);
      colorButtons.current.get(next)?.focus();
    }
  }

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
    <div className="mx-auto w-full max-w-[820px] px-5 py-7 pb-24 @sm/app:px-8 @sm/app:py-9 @sm/app:pb-28">
      <PageHeader title={t("newAccount")} breadcrumb={t("breadcrumbNew")} backHref="/accounts" />

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
              placeholder={t("namePlaceholder")}
              value={form.name}
            />
          </label>

          <fieldset className="min-w-0">
            <legend className="mb-2 text-sm font-medium text-foreground">{t("accountType")}</legend>
            <div aria-label={t("accountType")} className="grid grid-cols-2 gap-2 @sm/app:grid-cols-3" role="radiogroup">
              {accountTypes.map((type) => (
                <button aria-checked={form.type === type.value} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${form.type === type.value ? "border-primary bg-primary-soft text-primary" : "border-border bg-background text-muted hover:bg-surface hover:text-foreground"}`} key={type.value} onClick={() => {
                  const defaults = typeDefaults[type.value];
                  setForm((current) => ({ ...current, type: type.value, icon: defaults.icon, color: defaults.color }));
                }} onKeyDown={(event) => handleRadioKeyDown(event, accountTypes.map((item) => item.value), type.value, "type")} ref={(element) => { if (element) typeButtons.current.set(type.value, element); else typeButtons.current.delete(type.value); }} role="radio" tabIndex={form.type === type.value ? 0 : -1} type="button">{t(type.labelKey)}</button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="grid gap-5 @md/app:grid-cols-2">
          {(form.type === "bank" || form.type === "ewallet") && <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("accountNumber")} <span className="font-normal text-muted">({t("optional")})</span></span>
            <input
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none placeholder:text-muted/80 focus-visible:ring-2 focus-visible:ring-primary/30"
              onChange={(event) => updateField("account_number", event.target.value)}
              placeholder={t("accountNumberPlaceholder")}
              value={form.account_number}
            />
          </label>}

          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("initialBalance")}</span>
            <span className="flex h-11 items-center rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary/30">
              <span aria-hidden="true" className="pl-3 text-sm font-semibold text-muted">Rp</span>
              <input aria-label={t("initialBalance")} className="h-full min-w-0 flex-1 rounded-r-xl bg-transparent px-2 text-sm tabular-nums text-foreground outline-none placeholder:text-muted/80" inputMode="numeric" onChange={(event) => updateField("initial_balance", formatMoneyInput(event.target.value))} placeholder="0" type="text" value={form.initial_balance} />
            </span>
          </label>
        </div>

        <section aria-labelledby="account-appearance-heading" className="space-y-4 rounded-2xl border border-border bg-background p-4 @sm/app:p-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground" id="account-appearance-heading">{t("appearance")}</h3>
            <p className="mt-1 text-xs text-muted">{t("appearanceHint")}</p>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">{t("icon")}</legend>
            <div aria-label={t("icon")} className="grid grid-cols-5 gap-2 @sm/app:grid-cols-10" role="radiogroup">
              {accountIcons.map(({ value, icon: Icon, labelKey }) => <button aria-checked={form.icon === value} aria-label={t(labelKey)} className={`flex min-h-11 min-w-0 items-center justify-center rounded-xl border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${form.icon === value ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-muted hover:text-foreground"}`} key={value} onClick={() => updateField("icon", value)} onKeyDown={(event) => handleRadioKeyDown(event, accountIcons.map((item) => item.value), value, "icon")} ref={(element) => { if (element) iconButtons.current.set(value, element); else iconButtons.current.delete(value); }} role="radio" tabIndex={form.icon === value ? 0 : -1} title={t(labelKey)} type="button"><Icon aria-hidden="true" className="size-5" /></button>)}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">{t("color")}</legend>
            <div aria-label={t("color")} className="grid grid-cols-5 gap-2 @sm/app:grid-cols-10" role="radiogroup">
              {accountColors.map((color) => <button aria-checked={form.color === color.value} aria-label={t(color.labelKey)} className={`flex size-11 justify-self-center items-center justify-center rounded-full border-2 transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${form.color === color.value ? "border-foreground ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-transparent"}`} key={color.value} onClick={() => updateField("color", color.value)} onKeyDown={(event) => handleRadioKeyDown(event, accountColors.map((item) => item.value), color.value, "color")} ref={(element) => { if (element) colorButtons.current.set(color.value, element); else colorButtons.current.delete(color.value); }} role="radio" tabIndex={form.color === color.value ? 0 : -1} title={t(color.labelKey)} type="button" style={{ backgroundColor: color.value }}>{form.color === color.value && <Check aria-hidden="true" className="size-5 text-[#0f172a]" strokeWidth={3} />}</button>)}
            </div>
          </fieldset>
          <div aria-live="polite" className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: form.color, color: "#0f172a" }}>{(() => { const PreviewIcon = accountIcons.find((item) => item.value === form.icon)?.icon ?? Wallet; return <PreviewIcon aria-hidden="true" className="size-5" />; })()}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{form.name.trim() || t("previewAccount")}</span><span className="block text-xs text-muted">{t(accountTypes.find((type) => type.value === form.type)?.labelKey ?? "typeOther")}</span></span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">Rp {form.initial_balance || "0"}</span>
          </div>
        </section>

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
