"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
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
  account_id?: number | string;
  category_id?: number | string | null;
  to_account_id?: number | string | null;
};

type FilterOption = { id: number; name: string };
type TransactionPage = { data?: TransactionRecord[]; last_page?: number };
type TransactionPayload = {
  success?: boolean;
  message?: string;
  data?: TransactionRecord[] | TransactionPage;
};

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "description-asc";

export default function TransactionsView() {
  const t = useTranslations("Transactions");
  const locale = useLocale();
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "income" | "expense" | "transfer">("all");
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState<FilterOption[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
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
        const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };
        const [transactionsResponse, accountsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/transactions?per_page=100&page=1", { headers, signal: controller.signal }),
          fetch("/api/accounts", { headers, signal: controller.signal }),
          fetch("/api/categories", { headers, signal: controller.signal }),
        ]);

        if ([transactionsResponse, accountsResponse, categoriesResponse].some((item) => item.status === 401)) {
          sessionStorage.removeItem("auth_token");
          router.replace("/login");
          return;
        }

        const [transactionsPayload, accountsPayload, categoriesPayload] = await Promise.all([
          transactionsResponse.json() as Promise<TransactionPayload>,
          accountsResponse.json() as Promise<{ success?: boolean; message?: string; data?: FilterOption[] | { accounts?: FilterOption[] } }>,
          categoriesResponse.json() as Promise<{ success?: boolean; message?: string; data?: FilterOption[] }>,
        ]);

        if (!transactionsResponse.ok || !transactionsPayload.success) {
          throw new Error(transactionsPayload.message ?? "Unable to load transactions.");
        }
        if (!accountsResponse.ok || !accountsPayload.success) {
          throw new Error(accountsPayload.message ?? "Unable to load accounts.");
        }
        if (!categoriesResponse.ok || !categoriesPayload.success) {
          throw new Error(categoriesPayload.message ?? "Unable to load categories.");
        }

        const firstPage = Array.isArray(transactionsPayload.data)
          ? transactionsPayload.data
          : transactionsPayload.data?.data ?? [];
        const lastPage = Array.isArray(transactionsPayload.data)
          ? 1
          : Math.max(1, Number(transactionsPayload.data?.last_page ?? 1));
        const pageResponses = await Promise.all(
          Array.from({ length: lastPage - 1 }, (_, index) =>
            fetch(`/api/transactions?per_page=100&page=${index + 2}`, { headers, signal: controller.signal }),
          ),
        );
        if (pageResponses.some((item) => item.status === 401)) {
          sessionStorage.removeItem("auth_token");
          router.replace("/login");
          return;
        }
        const pagePayloads = await Promise.all(pageResponses.map((response) => response.json() as Promise<TransactionPayload>));
        const nextTransactions = [
          ...firstPage,
          ...pagePayloads.flatMap((payload, index) => {
            if (!pageResponses[index].ok || !payload.success) {
              throw new Error(payload.message ?? "Unable to load transactions.");
            }
            return Array.isArray(payload.data) ? payload.data : payload.data?.data ?? [];
          }),
        ];

        setTransactions(nextTransactions);
        const accountData = accountsPayload.data;
        setAccounts(Array.isArray(accountData) ? accountData : accountData?.accounts ?? []);
        setCategories(Array.isArray(categoriesPayload.data) ? categoriesPayload.data : []);
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

  const selectedAccountName = accounts.find((account) => String(account.id) === selectedAccount)?.name;
  const selectedCategoryName = categories.find((category) => String(category.id) === selectedCategory)?.name;

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
      const transactionDate = transaction.transaction_date ?? transaction.date ?? "";
      const matchesDate =
        (!startDate || transactionDate.slice(0, 10) >= startDate) &&
        (!endDate || transactionDate.slice(0, 10) <= endDate);
      const matchesAccount =
        !selectedAccount ||
        String(transaction.account_id ?? "") === selectedAccount ||
        String(transaction.to_account_id ?? "") === selectedAccount ||
        transaction.account?.name === selectedAccountName ||
        transaction.to_account?.name === selectedAccountName;
      const matchesCategory =
        !selectedCategory ||
        String(transaction.category_id ?? "") === selectedCategory ||
        transaction.category?.name === selectedCategoryName;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        description.toLowerCase().includes(normalizedSearch) ||
        String(transaction.id).includes(normalizedSearch);

      return matchesFilter && matchesSearch && matchesDate && matchesAccount && matchesCategory;
    });
  }, [endDate, search, selectedAccount, selectedAccountName, selectedCategory, selectedCategoryName, selectedFilter, startDate, transactions]);

  const sortedTransactions = useMemo(() => [...visibleTransactions].sort((left, right) => {
    if (sortBy.startsWith("date")) {
      const leftDate = (left.transaction_date ?? left.date ?? "").slice(0, 10);
      const rightDate = (right.transaction_date ?? right.date ?? "").slice(0, 10);
      return sortBy === "date-desc" ? rightDate.localeCompare(leftDate) : leftDate.localeCompare(rightDate);
    }
    if (sortBy.startsWith("amount")) {
      const difference = Number(left.amount ?? 0) - Number(right.amount ?? 0);
      return sortBy === "amount-desc" ? -difference : difference;
    }
    return (left.notes ?? "").localeCompare(right.notes ?? "", undefined, { sensitivity: "base" });
  }), [sortBy, visibleTransactions]);
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, TransactionRecord[]>();
    for (const transaction of sortedTransactions) {
      const date = (transaction.transaction_date ?? transaction.date ?? "").slice(0, 10);
      groups.set(date, [...(groups.get(date) ?? []), transaction]);
    }
    return [...groups.entries()];
  }, [sortedTransactions]);

  const activeFilterCount = [
    search.trim(),
    selectedFilter === "all" ? "" : selectedFilter,
    startDate,
    endDate,
    selectedAccount,
    selectedCategory,
  ].filter(Boolean).length;

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setSelectedAccount("");
    setSelectedCategory("");
    setSelectedFilter("all");
    setSearch("");
  }

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

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs @sm/app:p-5">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-2 pb-1">
            {(["all", "income", "expense", "transfer"] as const).map((filter) => (
              <button
                aria-pressed={selectedFilter === filter}
                className={`inline-flex h-9 shrink-0 items-center rounded-md px-3 text-sm font-medium transition-colors ${
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
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t("searchPlaceholder")}</span>
            <input className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20" onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} type="search" value={search} />
          </label>
          <button
            aria-controls="transaction-filters"
            aria-expanded={filtersOpen}
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${filtersOpen || activeFilterCount > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-background text-foreground hover:bg-background/70"}`}
            onClick={() => setFiltersOpen((open) => !open)}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            {t("filters")}
            {activeFilterCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">{activeFilterCount}</span>}
            <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {filtersOpen && (
          <div className="mt-4 border-t border-border pt-4" id="transaction-filters">
            <div className="grid gap-3 sm:grid-cols-2 @lg/app:grid-cols-4">
              <label className="space-y-1.5 text-xs font-medium text-muted">
                <span>{t("startDate")}</span>
                <input className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-muted">
                <span>{t("endDate")}</span>
                <input className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-muted">
                <span>{t("filterAccount")}</span>
                <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" onChange={(event) => setSelectedAccount(event.target.value)} value={selectedAccount}>
                  <option value="">{t("allAccounts")}</option>
                  {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-medium text-muted">
                <span>{t("filterCategory")}</span>
                <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" onChange={(event) => setSelectedCategory(event.target.value)} value={selectedCategory}>
                  <option value="">{t("allCategories")}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-medium text-muted sm:col-span-2 @lg/app:col-span-2">
                <span>{t("sortBy")}</span>
                <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" onChange={(event) => setSortBy(event.target.value as SortOption)} value={sortBy}>
                  <option value="date-desc">{t("sortDateNewest")}</option>
                  <option value="date-asc">{t("sortDateOldest")}</option>
                  <option value="amount-desc">{t("sortAmountHigh")}</option>
                  <option value="amount-asc">{t("sortAmountLow")}</option>
                  <option value="description-asc">{t("sortDescription")}</option>
                </select>
              </label>
              {activeFilterCount > 0 && (
                <div className="flex items-end sm:col-span-2 @lg/app:col-span-2 @lg/app:justify-end">
                  <button className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground" onClick={clearFilters} type="button">
                    <X aria-hidden="true" className="size-4" />
                    {t("clearFilters")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-surface shadow-xs">
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
          <div className="flex flex-col items-center px-5 py-12 text-center"><span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><SlidersHorizontal aria-hidden="true" className="size-5" /></span><p className="text-sm font-semibold text-foreground">{t("emptyState")}</p><p className="mt-1 max-w-xs text-sm text-muted">{t("emptyStateHint")}</p><button className="mt-4 text-sm font-semibold text-primary underline underline-offset-4" onClick={clearFilters} type="button">{t("clearFilters")}</button><Link href="/transactions/new" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"><span aria-hidden="true">+</span>{t("addTransaction")}</Link></div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.9fr] border-b border-border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted @md/app:grid">
              <span>{t("description")}</span>
              <span>{t("account")}</span>
              <span>{t("date")}</span>
              <span className="text-right">{t("amount")}</span>
            </div>

            <div className="divide-y divide-border">
              {groupedTransactions.map(([groupDate, groupItems]) => (
                <section key={groupDate} className="px-4 py-2">
                  <h3 className="relative z-0 border-b border-border/70 bg-surface px-2 py-2 text-xs font-semibold capitalize text-muted">{new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${groupDate}T00:00:00Z`))}</h3>
                  <div className="divide-y divide-border/70">
              {groupItems.map((transaction) => {
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
                    className="grid gap-3 rounded-xl px-2 py-4 transition-colors hover:bg-background/60 @md/app:grid-cols-[1.4fr_1fr_1fr_0.9fr] @md/app:items-center"
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
                    <div className="hidden text-sm text-muted @md/app:block">
                      {new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
                        day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
                      }).format(new Date(`${transactionDate.slice(0, 10)}T00:00:00Z`))}
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
                      <Link
                        aria-label={`${t("edit")} ${description}`}
                        className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        href={`/transactions/${transaction.id}/edit`}
                        title={t("edit")}
                      >
                        {t("edit")}
                      </Link>
                    </div>
                  </div>
                );
              })}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
