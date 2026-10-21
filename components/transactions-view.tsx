"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Link from "next/link";
import { formatCurrency, normalizeTransactionType } from "@/lib/finance-helpers.mjs";
import LoadingBar from "@/components/ui/loading-bar";

type TransactionRecord = {
  id: number;
  type?: string;
  amount?: number | string;
  notes?: string | null;
  transaction_date?: string;
  date?: string;
  account?: { name?: string } | null;
  category?: { name?: string } | null;
  to_account?: { name?: string } | null;
};

export default function TransactionsView() {
  const t = useTranslations("Transactions");
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "income" | "expense" | "transfer">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("auth_token");

    if (!token) {
      router.replace("/login");
      return () => controller.abort();
    }

    async function loadTransactions() {
      try {
        const response = await fetch("/api/transactions", {
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

        const payload = (await response.json()) as {
          success?: boolean;
          message?: string;
          data?: TransactionRecord[] | { data?: TransactionRecord[] };
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load transactions.");
        }

        const nextTransactions = Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.data?.data)
            ? payload.data.data
            : [];

        setTransactions(nextTransactions);
        setError("");
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load transactions.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTransactions();
    return () => controller.abort();
  }, [router]);

  const visibleTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const type = normalizeTransactionType(transaction.type);
      const matchesFilter = selectedFilter === "all" || type === selectedFilter;
      const description = [
        transaction.notes,
        transaction.category?.name,
        transaction.account?.name,
        transaction.to_account?.name,
        "",
      ].join(" ");
      const matchesSearch =
        normalizedSearch.length === 0 ||
        description.toLowerCase().includes(normalizedSearch) ||
        String(transaction.id).includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [search, selectedFilter, transactions]);

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

        <div className="flex items-center gap-2">
          <Link
            className="inline-flex h-10 items-center rounded-md bg-brand px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            href="/transactions/new"
          >
            {t("addTransaction")}
          </Link>
        </div>
      </div>

      <section className="rounded-md border border-border bg-surface p-4 @sm/app:p-5">
        <div className="flex flex-col gap-3 @lg/app:flex-row @lg/app:items-center @lg/app:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "income", "expense", "transfer"] as const).map((filter) => (
              <button
                className={`inline-flex h-9 items-center rounded-md px-3 text-sm font-medium ${
                  selectedFilter === filter
                    ? "bg-primary text-white"
                    : "border border-border bg-background text-muted"
                }`}
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                type="button"
              >
                {t(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`)}
              </button>
            ))}
          </div>

          <label className="block w-full max-w-xs text-sm text-muted @lg/app:w-auto">
            <span className="sr-only">{t("searchPlaceholder")}</span>
            <input
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              type="search"
              value={search}
            />
          </label>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-md border border-border bg-surface">
        {loading ? (
          <div>
            <LoadingBar />
            <div className="divide-y divide-border/60 p-2" role="status" aria-busy="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded-full bg-slate-200 animate-pulse" />
                      <div className="h-2.5 w-24 rounded-full bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-20 rounded-lg bg-slate-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="px-4 py-8">
            <p className="text-sm text-foreground">{error}</p>
            <button
              className="mt-4 inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
              onClick={() => window.location.reload()}
              type="button"
            >
              {t("retry")}
            </button>
          </div>
        ) : visibleTransactions.length === 0 ? (
          <div className="px-4 py-8 text-sm text-muted">{t("emptyState")}</div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.9fr] border-b border-border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted @md/app:grid">
              <span>{t("description")}</span>
              <span>{t("account")}</span>
              <span>{t("date")}</span>
              <span className="text-right">{t("amount")}</span>
            </div>

            <div className="divide-y divide-border">
              {visibleTransactions.map((transaction) => {
                const type = normalizeTransactionType(transaction.type);
                const amount = Number(transaction.amount ?? 0);
                const accountName =
                  type === "transfer"
                    ? [transaction.account?.name, "→", transaction.to_account?.name].filter(Boolean).join(" ")
                    : transaction.account?.name ?? t("account") ;
                const description = transaction.notes || t("untitledTransaction");
                const transactionDate =
                  transaction.transaction_date ?? transaction.date ?? new Date().toISOString();

                return (
                  <div
                    className="grid gap-3 px-4 py-4 @md/app:grid-cols-[1.4fr_1fr_1fr_0.9fr] @md/app:items-center"
                    key={transaction.id}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                          {transaction.category?.name ?? (type === "transfer" ? t("transfer") : t("category"))}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                            type === "income"
                              ? "bg-income/10 text-income"
                              : type === "expense"
                                ? "bg-expense/10 text-expense"
                                : "bg-primary-soft text-primary"
                          }`}
                        >
                          {type}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-muted">{accountName}</div>
                    <div className="text-sm text-muted">
                      {new Date(transactionDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-2 @md/app:justify-end">
                      <p
                        className={`text-sm font-semibold ${
                          type === "income"
                            ? "text-income"
                            : type === "expense"
                              ? "text-expense"
                              : "text-primary"
                        }`}
                      >
                        {type === "income" ? "+" : type === "expense" ? "-" : "↔ "}
                        {formatCurrency(amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
