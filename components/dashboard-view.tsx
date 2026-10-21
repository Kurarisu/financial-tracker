"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import DashboardLoading from "@/components/dashboard/dashboard-loading";
import { buildDailyBalance, type ApiResponse, type CashflowPoint, type DashboardSummary, type TransactionPage } from "@/components/dashboard/dashboard-data";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import CashflowChart from "@/components/dashboard/cashflow-chart";
import DailyBalanceChart from "@/components/dashboard/daily-balance-chart";
import type { DailyBalancePoint } from "@/components/dashboard/daily-balance-chart";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import SummaryCards from "@/components/dashboard/summary-cards";

export default function DashboardView() {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflow, setCashflow] = useState<CashflowPoint[]>([]);
  const [dailyBalance, setDailyBalance] = useState<DailyBalancePoint[]>([]);
  const [monthNetChange, setMonthNetChange] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
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
    income: Number(summary.cashflow.current_month_income),
    expenses: Number(summary.cashflow.current_month_expense),
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t("eyebrow")}
          </p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t("title")}
          </h2>
        </div>
        <div
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/80
            bg-surface px-3 text-xs font-semibold text-muted shadow-xs"
        >
          <CalendarDays aria-hidden="true" className="size-3.5 text-muted" />
          {t("period")}
        </div>
      </div>

      <div className="space-y-4">
        <SummaryCards values={summaryValues} accounts={summary.accounts} />

        <DailyBalanceChart
          data={dailyBalance}
          netChange={monthNetChange}
        />

        <div className="grid gap-4 @xl/app:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.9fr)]">
          <CashflowChart data={cashflow} />
          <RecentTransactions transactions={summary.recent_transactions} />
        </div>
      </div>
    </div>
  );
}
