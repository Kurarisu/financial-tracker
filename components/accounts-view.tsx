"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Coins, Landmark, Plus, Search, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/finance-helpers.mjs";
import LoadingBar from "@/components/ui/loading-bar";

type AccountRecord = {
  id: number;
  name: string;
  type?: string;
  current_balance?: number | string;
  initial_balance?: number | string;
  account_number?: string | null;
  color?: string;
  icon?: string;
};

type AccountsApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    total_net_balance?: number | string;
    accounts?: AccountRecord[];
  };
};

export default function AccountsView() {
  const t = useTranslations("Accounts");
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const visibleAccounts = useMemo(() => accounts.filter((account) =>
    account.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ), [accounts, search]);

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("auth_token");

    if (!token) {
      router.replace("/login");
      return () => controller.abort();
    }

    async function loadAccounts() {
      try {
        const response = await fetch("/api/accounts", {
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

        const payload = (await response.json()) as AccountsApiResponse;

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message ?? "Unable to load accounts.");
        }

        const nextAccounts = Array.isArray(payload.data.accounts) ? [...payload.data.accounts].sort((a, b) => Number(b.type === "cash") - Number(a.type === "cash")) : [];
        setAccounts(nextAccounts);
        setTotalBalance(Number(payload.data.total_net_balance ?? 0));
        setError("");
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load accounts.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadAccounts();
    return () => controller.abort();
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-7 @sm/app:px-8 @sm/app:py-9">
      <div className="mb-6 flex flex-col gap-4 @sm/app:flex-row @sm/app:items-end @sm/app:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {t("workspace")}
          </p>
          <h2 className="text-2xl font-semibold tracking-normal @sm/app:text-[28px]">
            {t("title")}
          </h2>
        </div>

        <Link
          className="inline-flex h-10 items-center rounded-md bg-brand px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          href="/accounts/new"
        >
          <Plus aria-hidden="true" className="mr-2 size-4" />
          {t("addAccount")}
        </Link>
      </div>

      <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#142e52] via-[#183b64] to-[#10213b] p-5 text-white shadow-sm @sm/app:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 size-60 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">{t("totalBalance")}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums @sm/app:text-4xl">{formatCurrency(totalBalance)}</p>
            <p className="mt-2 text-sm text-blue-100/80">{t("accountCount", { count: accounts.length })}</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-4" role="status" aria-busy="true">
          <LoadingBar />
          <div className="grid gap-4 @md/app:grid-cols-2 @xl/app:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border/80 bg-surface p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-28 rounded-full bg-slate-200 animate-pulse" />
                      <div className="h-2.5 w-16 rounded-full bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                  <div className="size-4 rounded-full bg-slate-200 animate-pulse" />
                </div>
                <div className="pt-2">
                  <div className="h-6 w-32 rounded-lg bg-slate-200 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-8 text-sm text-red-700">
          {error}
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-md border border-border bg-surface px-4 py-8 text-sm text-muted">
          {t("emptyState")}
        </div>
      ) : (
        <section>
          <div className="mb-4">
            <label className="group relative block w-full">
              <span className="sr-only">{t("searchAccounts")}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted transition-colors group-focus-within:text-brand" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchAccounts")} className="h-12 w-full rounded-2xl border border-border/80 bg-surface pl-11 pr-4 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted/80 hover:border-border focus:border-brand/50 focus:ring-4 focus:ring-brand/10 @sm/app:max-w-sm" />
            </label>
          </div>
          {visibleAccounts.length ? <div className="grid gap-4 @md/app:grid-cols-2 @xl/app:grid-cols-3">
          {visibleAccounts.map((account) => {
            const AccountIcon = account.type === "cash" ? Coins : account.type === "bank" ? Landmark : Wallet;
            const typeName = account.type === "cash" ? t("typeCash") : account.type === "bank" ? t("typeBank") : account.type === "ewallet" ? t("typeEwallet") : account.type === "investment" ? t("typeInvestment") : t("typeOther");
            return <article key={account.id} className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: account.color ?? "#19365E" }} />
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${account.color ?? "#E8EEF5"}22`, color: account.color ?? "#19365E" }}
                  >
                    <AccountIcon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{account.name}</p>
                    <p className="text-xs text-muted">{typeName}</p>
                  </div>
                </div>
                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted transition group-hover:text-brand" />
              </div>

              <div className="mt-6 border-t border-border/70 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t("balance")}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${Number(account.current_balance ?? account.initial_balance ?? 0) < 0 ? "text-rose-600" : "text-foreground"}`}>
                  {formatCurrency(Number(account.current_balance ?? account.initial_balance ?? 0))}
                </p>
              </div>

              {account.account_number ? (
                <p className="mt-3 text-xs text-muted">{t("accountNumber")}: •••• {account.account_number.slice(-4)}</p>
              ) : null}
            </article>;
          })}
          </div> : <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-muted">{t("noMatchingAccounts")}</div>}
        </section>
      )}
    </div>
  );
}
