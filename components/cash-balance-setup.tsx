"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Coins, Loader2, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money-input";
import LoadingBar from "@/components/ui/loading-bar";

type Account = { id: number; type: string };
type ApiResponse<T> = { success?: boolean; message?: string; data?: T };
type AccountsResponse = { accounts?: Account[] };

export default function CashBalanceSetup() {
  const t = useTranslations("CashSetup");
  const router = useRouter();
  const [accountId, setAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return () => controller.abort();
    }

    async function loadCashAccount() {
      try {
        const response = await fetch("/api/accounts", {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401) {
          sessionStorage.removeItem("auth_token");
          router.replace("/login");
          return;
        }
        const result = await response.json() as ApiResponse<AccountsResponse>;
        const cashAccount = result.data?.accounts?.find((account) => account.type === "cash");
        if (!response.ok || !result.success || !cashAccount) {
          throw new Error(result.message ?? t("loadError"));
        }
        setAccountId(cashAccount.id);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : t("loadError"));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCashAccount();
    return () => controller.abort();
  }, [router, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("auth_token");
    const openingBalance = amount.trim() ? parseMoneyInput(amount) : 0;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (accountId === null || !Number.isFinite(openingBalance) || openingBalance < 0) {
      setError(t("invalidAmount"));
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/accounts", {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_id: accountId, initial_balance: openingBalance }),
      });
      const result = await response.json() as ApiResponse<unknown>;
      if (response.status === 401) {
        sessionStorage.removeItem("auth_token");
        router.replace("/login");
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? t("saveError"));
      }
      router.replace("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  function skipSetup() {
    router.replace("/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface shadow-lg">
        <div className="bg-gradient-to-br from-[#142e52] via-[#183b64] to-[#10213b] p-6 text-white sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
            <Coins aria-hidden="true" className="size-6" />
          </span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">{t("eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100/80">{t("description")}</p>
        </div>

        <form className="space-y-5 p-6 sm:p-8" onSubmit={handleSubmit}>
          {loading ? (
            <div className="space-y-3" role="status" aria-busy="true"><LoadingBar /><p className="text-sm text-muted">{t("loading")}</p></div>
          ) : (
            <>
              <label className="block space-y-2 text-sm font-medium text-foreground">
                <span>{t("amountLabel")}</span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-muted">Rp</span>
                  <input
                    autoFocus
                    inputMode="decimal"
                    onChange={(event) => setAmount(formatMoneyInput(event.target.value))}
                    className="h-14 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-lg font-semibold tabular-nums outline-none transition focus:border-brand/60 focus:ring-4 focus:ring-brand/10"
                    aria-describedby="cash-balance-note"
                    value={amount}
                  />
                </div>
              </label>
              <p id="cash-balance-note" className="text-xs leading-5 text-muted">{t("amountHint")}</p>
              {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
              <div className="space-y-2 pt-1">
                <button type="submit" disabled={loading || saving || accountId === null} className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">
                  {saving && <Loader2 className="size-4 animate-spin" />}{saving ? t("saving") : t("continue")}
                </button>
                <button type="button" disabled={loading || saving} onClick={skipSetup} className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-60">
                  <SkipForward aria-hidden="true" className="size-4" />{t("skip")}
                </button>
              </div>
            </>
          )}
        </form>
      </section>
    </main>
  );
}
