"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Wallet, Eye, EyeOff, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import AccountBalances from "@/components/dashboard/account-balances";

type SummaryValues = {
  balance: number;
  income: number;
  expenses: number;
};

type AccountBalance = {
  id: number;
  name: string;
  type: string;
  current_balance: number | string;
  color?: string | null;
};

export default function SummaryCards({ values, accounts }: { values: SummaryValues; accounts: AccountBalance[] }) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const [showBalance, setShowBalance] = useState(true);

  const currency = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  return (
    <section aria-label={t("monthlySummary")} className="flex flex-col gap-3">
      {/* Primary Hero Balance Card */}
      <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#122645] via-[#18355c] to-[#0f213d] p-5 text-white shadow-sm border border-white/10">
        {/* Subtle decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-emerald-500/15 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-6 -bottom-6 size-32 rounded-full bg-blue-500/15 blur-2xl"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm text-emerald-400">
                <Wallet aria-hidden="true" className="size-3.5" />
              </span>
              <p className="text-xs font-medium text-slate-300">{t("totalBalance")}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBalance((prev) => !prev)}
              className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title={showBalance ? "Hide balance" : "Show balance"}
              aria-label={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? (
                <Eye aria-hidden="true" className="size-4" />
              ) : (
                <EyeOff aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>

          <div className="mt-3.5">
            <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl tabular-nums">
              {showBalance ? currency.format(values.balance) : "••••••••"}
            </h3>
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              {t("acrossAccounts")}
            </p>
          </div>
          <AccountBalances accounts={accounts} visible={showBalance} />
        </div>
      </article>

      {/* Income and Expenses Dual Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income Sub-card */}
        <article className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4 transition-all hover:bg-emerald-50/70">
          <div className="flex items-center justify-between gap-1">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <ArrowDownLeft aria-hidden="true" className="size-3.5" />
            </span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-emerald-700/80">
              {t("thisMonth")}
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-xs font-medium text-muted">{t("income")}</p>
            <p className="mt-1 truncate text-base font-bold text-emerald-700 sm:text-lg tabular-nums">
              {currency.format(values.income)}
            </p>
          </div>
        </article>

        {/* Expenses Sub-card */}
        <article className="relative overflow-hidden rounded-2xl border border-rose-200/60 bg-rose-50/40 p-4 transition-all hover:bg-rose-50/70">
          <div className="flex items-center justify-between gap-1">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-rose-700/80">
              {t("thisMonth")}
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-xs font-medium text-muted">{t("expenses")}</p>
            <p className="mt-1 truncate text-base font-bold text-rose-700 sm:text-lg tabular-nums">
              {currency.format(values.expenses)}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
