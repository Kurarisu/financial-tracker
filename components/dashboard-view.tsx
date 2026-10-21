"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import CashflowChart from "@/components/dashboard/cashflow-chart";
import DailyBalanceChart, { type DailyBalancePoint } from "@/components/dashboard/daily-balance-chart";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import SummaryCards from "@/components/dashboard/summary-cards";
import LoadingBar from "@/components/ui/loading-bar";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type DashboardSummary = {
  total_net_balance: number | string;
  cashflow: {
    current_month_income: number | string;
    current_month_expense: number | string;
    net_cash_flow: number | string;
  };
  accounts: { id: number; name: string; type: string; current_balance: number | string; color?: string | null }[];
  recent_transactions: {
    id: number;
    type: "income" | "expense" | "transfer";
    amount: number | string;
    notes: string | null;
    transaction_date: string;
  }[];
};

type CashflowPoint = {
  period: string;
  income: number | string;
  expense: number | string;
  net: number | string;
};

type DashboardTransaction = {
  account_id: number;
  type: "income" | "expense" | "transfer";
  amount: number | string;
  transaction_date: string;
};

type TransactionPage = {
  data: DashboardTransaction[];
  last_page: number;
};

function buildDailyBalance(
  balance: number,
  activeAccountIds: Set<number>,
  transactions: DashboardTransaction[],
) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyNet = new Map<number, number>();

  for (const transaction of transactions) {
    if (
      !activeAccountIds.has(transaction.account_id) ||
      (transaction.type !== "income" && transaction.type !== "expense")
    ) continue;

    const day = Number(transaction.transaction_date.slice(8, 10));
    const amount = Number(transaction.amount) * (transaction.type === "income" ? 1 : -1);
    dailyNet.set(day, (dailyNet.get(day) ?? 0) + amount);
  }

  const netChange = [...dailyNet.values()].reduce((sum, amount) => sum + amount, 0);
  let runningBalance = balance - netChange;
  const data: DailyBalancePoint[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const change = dailyNet.get(day) ?? 0;
    if (day <= today) runningBalance += change;
    data.push({ day, balance: day <= today ? runningBalance : null });
  }

  return { data, netChange };
}

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

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-5 py-5 sm:px-6" role="status" aria-busy="true">
        <LoadingBar className="mb-4" />

        {/* Title skeleton */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-6 w-36 rounded-lg bg-slate-200 animate-pulse" />
          </div>
          <div className="h-8 w-28 rounded-full bg-slate-200 animate-pulse" />
        </div>

        <div className="space-y-4">
          {/* Hero balance skeleton */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#122645] to-[#18355c] p-5 text-white shadow-sm border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-white/10 animate-pulse" />
                <div className="h-3 w-20 rounded-full bg-white/20 animate-pulse" />
              </div>
              <div className="size-6 rounded-lg bg-white/10 animate-pulse" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-8 w-48 rounded-lg bg-white/20 animate-pulse" />
              <div className="h-3 w-32 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>

          {/* Income & Expense sub-cards skeleton */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/80 bg-surface p-4 space-y-3">
              <div className="size-7 rounded-lg bg-slate-200 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-5 w-24 rounded-lg bg-slate-200 animate-pulse" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-surface p-4 space-y-3">
              <div className="size-7 rounded-lg bg-slate-200 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-5 w-24 rounded-lg bg-slate-200 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Chart & Recent transactions skeleton */}
          <div className="grid gap-4 @xl/app:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.9fr)]">
            <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-4 w-20 rounded-full bg-slate-200 animate-pulse" />
              </div>
              <div className="flex h-44 items-end justify-between gap-3 pt-4">
                {[40, 70, 30, 85, 50, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div
                      className="w-full max-w-[24px] rounded-full bg-slate-100 animate-pulse"
                      style={{ height: `${h}%` }}
                    />
                    <div className="h-2.5 w-6 rounded-full bg-slate-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-24 rounded-full bg-slate-200 animate-pulse" />
                      <div className="h-2.5 w-16 rounded-full bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-16 rounded-lg bg-slate-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
