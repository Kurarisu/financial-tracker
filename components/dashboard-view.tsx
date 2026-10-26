"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import DashboardLoading from "@/components/dashboard/dashboard-loading";
import { buildDailyBalance, type ApiResponse, type CashflowPoint, type DashboardSummary, type TransactionPage } from "@/components/dashboard/dashboard-data";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import CashflowChart from "@/components/dashboard/cashflow-chart";
import DailyBalanceChart from "@/components/dashboard/daily-balance-chart";
import type { DailyBalancePoint } from "@/components/dashboard/daily-balance-chart";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import SummaryCards from "@/components/dashboard/summary-cards";
import { Link } from "@/i18n/navigation";

type MonthlyReport = { total_income: number | string; total_expense: number | string };
type CategoryBreakdown = { category_id: number; name: string; color?: string; total_amount: number | string; percentage: number | string };

export default function DashboardView() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflow, setCashflow] = useState<CashflowPoint[]>([]);
  const [dailyBalance, setDailyBalance] = useState<DailyBalancePoint[]>([]);
  const [monthNetChange, setMonthNetChange] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [previousMonthly, setPreviousMonthly] = useState<MonthlyReport | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [periodError, setPeriodError] = useState(false);
  const [periodAttempt, setPeriodAttempt] = useState(0);
  const periodLabel = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { month: "long", year: "numeric" }).format(new Date(selectedYear, selectedMonth - 1, 1));
  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("auth_token");

    if (!token) {
      router.replace("/login");
      return () => controller.abort();
    }

    async function loadDashboard() {
      try {
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
        const [summaryResponse, cashflowResponse] = await Promise.all([
          fetch("/api/dashboard/summary", { headers, signal: controller.signal }),
          fetch("/api/reports/cashflow-trend", { headers, signal: controller.signal }),
        ]);

        if (summaryResponse.status === 401 || cashflowResponse.status === 401) {
          sessionStorage.removeItem("auth_token");
          router.replace("/login");
          return;
        }

        const [summaryResult, cashflowResult] = await Promise.all([
          summaryResponse.json() as Promise<ApiResponse<DashboardSummary>>,
          cashflowResponse.json() as Promise<ApiResponse<CashflowPoint[]>>,
        ]);

        if (
          !summaryResponse.ok ||
          !cashflowResponse.ok ||
          !summaryResult.success ||
          !cashflowResult.success ||
          !summaryResult.data ||
          !cashflowResult.data
        ) {
          throw new Error("Dashboard API request failed");
        }

        const now = new Date();
        const query = `month=${now.getMonth() + 1}&year=${now.getFullYear()}&per_page=100`;
        const firstPageResponse = await fetch(`/api/transactions?${query}&page=1`, {
          headers,
          signal: controller.signal,
        });
        if (firstPageResponse.status === 401) {
          sessionStorage.removeItem("auth_token");
          router.replace("/login");
          return;
        }
        const firstPageResult = await firstPageResponse.json() as ApiResponse<TransactionPage>;
        if (!firstPageResponse.ok || !firstPageResult.success || !firstPageResult.data) {
          throw new Error("Daily balance data request failed");
        }
        const lastPage = Number(firstPageResult.data.last_page ?? 1);
        const remainingPages = await Promise.all(Array.from({ length: Math.max(0, lastPage - 1) }, async (_, index) => {
          const response = await fetch(`/api/transactions?${query}&page=${index + 2}`, { headers, signal: controller.signal });
          if (!response.ok) throw new Error("Daily balance data request failed");
          const result = await response.json() as ApiResponse<TransactionPage>;
          if (!result.success || !result.data) throw new Error("Daily balance data request failed");
          return result.data.data;
        }));
        const transactions = [...firstPageResult.data.data, ...remainingPages.flat()];
        const trend = buildDailyBalance(
          Number(summaryResult.data.total_net_balance),
          new Set(summaryResult.data.accounts.map((account) => account.id)),
          transactions,
        );

        setSummary(summaryResult.data);
        setCashflow(cashflowResult.data);
        setDailyBalance(trend.data);
        setMonthNetChange(trend.netChange);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [attempt, router]);

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("auth_token");
    if (!token) return () => controller.abort();
    setPeriodLoading(true);
    setPeriodError(false);
    async function loadPeriod() {
      try {
        const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };
        const query = `month=${selectedMonth}&year=${selectedYear}`;
        const previousDate = new Date(selectedYear, selectedMonth - 2, 1);
        const previousQuery = `month=${previousDate.getMonth() + 1}&year=${previousDate.getFullYear()}`;
        const [reportResponse, categoryResponse, previousResponse] = await Promise.all([
          fetch(`/api/reports/monthly?${query}`, { headers, signal: controller.signal }),
          fetch(`/api/reports/category-breakdown?${query}&type=expense`, { headers, signal: controller.signal }),
          fetch(`/api/reports/monthly?${previousQuery}`, { headers, signal: controller.signal }),
        ]);
        if (reportResponse.status === 401 || categoryResponse.status === 401 || previousResponse.status === 401) {
          sessionStorage.removeItem("auth_token"); router.replace("/login"); return;
        }
        const [report, category, previous] = await Promise.all([reportResponse.json(), categoryResponse.json(), previousResponse.json()]);
        if (!reportResponse.ok || !report.success || !report.data) throw new Error("Period report failed");
        if (!categoryResponse.ok || !category.success) throw new Error("Category report failed");
        setMonthly(report.data as MonthlyReport);
        setPreviousMonthly(previousResponse.ok && previous.success ? previous.data as MonthlyReport : null);
        setCategoryBreakdown(category.data?.breakdown ?? []);
      } catch {
        if (!controller.signal.aborted) { setMonthly(null); setPeriodError(true); }
      } finally {
        if (!controller.signal.aborted) setPeriodLoading(false);
      }
    }
    void loadPeriod();
    return () => controller.abort();
  }, [selectedMonth, selectedYear, periodAttempt, router]);

  if (status === "loading") return <DashboardLoading />;

  if (status === "error" || !summary) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-5 py-7 @sm/app:px-8 @sm/app:py-9">
        <div className="rounded-md border border-border bg-surface p-6" role="alert">
          <p className="text-sm text-foreground">{t("loadError")}</p>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md
              bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
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

  const summaryValues = {
    balance: Number(summary.total_net_balance),
    income: Number(monthly?.total_income ?? (selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear() ? summary.cashflow.current_month_income : 0)),
    expenses: Number(monthly?.total_expense ?? (selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear() ? summary.cashflow.current_month_expense : 0)),
  };
  const percentChange = (current: number, previous?: number) => previous && previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  const incomeChange = percentChange(summaryValues.income, previousMonthly ? Number(previousMonthly.total_income) : undefined);
  const expenseChange = percentChange(summaryValues.expenses, previousMonthly ? Number(previousMonthly.total_expense) : undefined);

  function moveMonth(amount: number) {
    const next = new Date(selectedYear, selectedMonth - 1 + amount, 1);
    setSelectedMonth(next.getMonth() + 1);
    setSelectedYear(next.getFullYear());
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-5 sm:px-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t("eyebrow")}
          </p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t("title")}
          </h2>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="inline-flex h-10 items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-xs" role="group" aria-label={t("chooseMonth")}>
            <button type="button" aria-label={t("previousMonth")} onClick={() => moveMonth(-1)} className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"><ChevronLeft aria-hidden="true" className="size-4" /></button>
            <span className="inline-flex min-w-32 items-center justify-center gap-2 px-1 text-sm font-semibold capitalize text-foreground"><CalendarDays aria-hidden="true" className="size-4 text-muted" />{periodLabel}</span>
            <button type="button" aria-label={t("nextMonth")} onClick={() => moveMonth(1)} disabled={selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth() + 1} className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-primary"><ChevronRight aria-hidden="true" className="size-4" /></button>
          </div>
          <Link href="/transactions/new" aria-label={t("addTransaction")} className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:hidden"><Plus aria-hidden="true" className="size-5" /></Link>
        </div>
      </div>

      <div className="space-y-4">
        <SummaryCards values={summaryValues} accounts={summary.accounts} periodLabel={periodLabel} incomeChange={incomeChange} expenseChange={expenseChange} />

        {selectedMonth === new Date().getMonth() + 1 && selectedYear === new Date().getFullYear() ? <DailyBalanceChart data={dailyBalance} netChange={monthNetChange} /> : null}

        <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5" aria-labelledby="category-breakdown-title">
          <div className="mb-4 flex items-center justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t("selectedPeriod")}</p><h3 id="category-breakdown-title" className="mt-0.5 text-base font-bold text-foreground">{t("categoryBreakdown")}</h3></div><span className="text-xs font-medium capitalize text-muted">{periodLabel}</span></div>
          {periodLoading ? <div className="space-y-4" role="status" aria-label={t("loading")} aria-busy="true">{[1, 2, 3].map((item) => <div key={item} className="h-9 animate-pulse rounded-lg bg-slate-200" />)}</div> : periodError ? <div className="rounded-xl border border-expense/30 p-4" role="alert"><p className="text-sm text-expense">{t("loadError")}</p><button type="button" className="mt-2 text-sm font-semibold text-primary underline underline-offset-4" onClick={() => setPeriodAttempt((attempt) => attempt + 1)}>{t("retry")}</button></div> : categoryBreakdown.some((item) => Number(item.total_amount) > 0) ? <div className="space-y-4">{categoryBreakdown.filter((item) => Number(item.total_amount) > 0).slice(0, 6).map((item) => <div key={item.category_id}><div className="mb-1.5 flex items-center gap-3 text-sm"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color || "#64748b" }} /><span className="min-w-0 flex-1 truncate font-medium">{item.name}</span><span className="shrink-0 tabular-nums text-muted">{new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(item.total_amount))}</span><span className="w-12 text-right text-xs tabular-nums text-muted">{Number(item.percentage).toFixed(0)}%</span></div><div className="ml-5 h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, Math.max(0, Number(item.percentage)))}%`, backgroundColor: item.color || "#64748b" }} /></div></div>)}</div> : <div className="rounded-xl border border-dashed border-border px-4 py-7 text-center"><p className="text-sm font-medium text-foreground">{t("emptyCategories")}</p><p className="mt-1 text-xs text-muted">{t("emptyCategoriesHint")}</p><Link href="/transactions/new" className="mt-3 inline-flex h-9 items-center rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover">{t("addTransaction")}</Link></div>}
        </section>

        <div className="grid min-w-0 grid-cols-1 gap-4 @xl/app:grid-cols-[minmax(0,1.55fr)_minmax(0,0.9fr)]">
          <CashflowChart data={cashflow} />
          <RecentTransactions transactions={summary.recent_transactions} />
        </div>
      </div>
    </div>
  );
}
