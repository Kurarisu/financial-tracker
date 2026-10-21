"use client";

import { CalendarDays, Download, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import LoadingBar from "@/components/ui/loading-bar";
import { downloadCsv, exportMonthAsCsv } from "@/lib/exports";

type ApiResponse<T> = { success?: boolean; message?: string; data?: T };
type MonthlyReport = { month: number; year: number; total_income: number | string; total_expense: number | string; net_savings: number | string };
type Breakdown = { period: string; total_expense: number | string; breakdown: { category_id: number; name: string; color: string; total_amount: number | string; percentage: number | string }[] };
const months = Array.from({ length: 12 }, (_, index) => index + 1);

export default function ReportsView() {
  const t = useTranslations("Navigation");
  const locale = useLocale();
  const router = useRouter();
  const isIndonesian = locale === "id";
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Breakdown | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [exporting, setExporting] = useState(false);
  const currency = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  const periodLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(selectedYear, selectedMonth - 1, 1));

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("auth_token");
    if (!token) { router.replace("/login"); return () => controller.abort(); }

    async function loadReports() {
      setStatus("loading"); setError("");
      try {
        const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };
        const query = `month=${selectedMonth}&year=${selectedYear}`;
        const [monthlyResponse, categoryResponse] = await Promise.all([
          fetch(`/api/reports/monthly?${query}`, { headers, signal: controller.signal }),
          fetch(`/api/reports/category-breakdown?${query}&type=expense`, { headers, signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        if (monthlyResponse.status === 401 || categoryResponse.status === 401) {
          sessionStorage.removeItem("auth_token"); router.replace("/login"); return;
        }
        const [monthlyResult, categoryResult] = await Promise.all([
          monthlyResponse.json() as Promise<ApiResponse<MonthlyReport>>,
          categoryResponse.json() as Promise<ApiResponse<Breakdown>>,
        ]);
        if (!monthlyResponse.ok || !monthlyResult.success || !monthlyResult.data) throw new Error(monthlyResult.message || (isIndonesian ? "Gagal memuat laporan." : "Could not load the report."));
        if (!categoryResponse.ok || !categoryResult.success || !categoryResult.data) throw new Error(categoryResult.message || (isIndonesian ? "Gagal memuat rincian kategori." : "Could not load category details."));
        setMonthly(monthlyResult.data); setCategoryBreakdown(categoryResult.data); setStatus("ready");
      } catch (loadError) {
        if (controller.signal.aborted || (loadError instanceof Error && loadError.name === "AbortError")) return;
        setError(loadError instanceof Error ? loadError.message : (isIndonesian ? "Gagal memuat laporan." : "Could not load the report.")); setStatus("error");
      }
    }
    void loadReports();
    return () => controller.abort();
  }, [selectedMonth, selectedYear, attempt, isIndonesian, router]);

  async function handleExport() {
    if (!monthly || exporting) return;
    setExporting(true);
    try {
      const blob = await exportMonthAsCsv(selectedMonth, selectedYear);
      downloadCsv(blob, `reports-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`);
    } catch (exportError) {
      console.error("Export failed", exportError);
      window.alert(isIndonesian ? "Ekspor gagal. Silakan coba lagi." : "Export failed. Please try again.");
    } finally { setExporting(false); }
  }

  const income = Number(monthly?.total_income ?? 0);
  const expenses = Number(monthly?.total_expense ?? 0);
  const savings = Number(monthly?.net_savings ?? 0);
  const ratio = income > 0 ? (expenses / income) * 100 : 0;
  const maxAmount = Math.max(income, expenses, 1);
  const metrics = [
    { label: isIndonesian ? "Pemasukan" : "Income", value: currency.format(income), tone: "text-income", marker: "bg-income" },
    { label: isIndonesian ? "Pengeluaran" : "Expenses", value: currency.format(expenses), tone: "text-expense", marker: "bg-expense" },
    { label: isIndonesian ? "Tabungan bersih" : "Net savings", value: currency.format(savings), tone: "text-primary", marker: "bg-primary" },
    { label: isIndonesian ? "Rasio pengeluaran" : "Expense ratio", value: `${ratio.toFixed(1)}%`, tone: "text-foreground", marker: "bg-muted" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 @sm/app:px-6 @sm/app:py-8">
      <header className="mb-6 @sm/app:mb-8">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("workspace")}</p>
        <h1 className="text-2xl font-semibold tracking-tight @sm/app:text-3xl">{t("reports")}</h1>
        <p className="mt-1 text-sm text-muted">{isIndonesian ? "Ringkasan keuangan untuk periode yang dipilih." : "A clear summary of your selected period."}</p>
      </header>

      <section aria-label={isIndonesian ? "Pilih periode laporan" : "Choose report period"} className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm @sm/app:mb-5 @sm/app:p-4">
        <div className="col-span-2 flex items-center gap-2 pb-1"><CalendarDays aria-hidden="true" className="size-4 text-muted" /><span className="text-sm font-semibold">{periodLabel}</span></div>
        <label className="sr-only" htmlFor="report-month">{isIndonesian ? "Bulan laporan" : "Report month"}</label>
        <select id="report-month" className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" onChange={(event) => setSelectedMonth(Number(event.target.value))} value={selectedMonth}>
          {months.map((month) => <option key={month} value={month}>{new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2026, month - 1, 1))}</option>)}
        </select>
        <label className="sr-only" htmlFor="report-year">{isIndonesian ? "Tahun laporan" : "Report year"}</label>
        <select id="report-year" className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" onChange={(event) => setSelectedYear(Number(event.target.value))} value={selectedYear}>
          {Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index).map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <button className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50" disabled={!monthly || expenses <= 0 || exporting || status !== "ready"} onClick={handleExport} type="button">
          <Download aria-hidden="true" className="size-4" /><span>{exporting ? (isIndonesian ? "Mengekspor…" : "Exporting…") : (isIndonesian ? "Ekspor CSV" : "Export CSV")}</span>
        </button>
      </section>

      {status === "loading" && <div className="rounded-xl border border-border bg-surface p-5"><LoadingBar /></div>}
      {status === "error" && <div role="alert" className="rounded-xl border border-expense/30 bg-surface p-5"><p className="text-sm text-expense">{error}</p><button type="button" className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white" onClick={() => setAttempt((value) => value + 1)}>{isIndonesian ? "Coba lagi" : "Try again"}</button></div>}

      {status === "ready" && monthly && (
        <>
          <section aria-label={isIndonesian ? "Ringkasan keuangan" : "Financial summary"} className="mb-4 grid grid-cols-2 gap-3 @sm/app:mb-5 @sm/app:gap-4">
            {metrics.map((metric) => <article key={metric.label} className="min-w-0 rounded-xl border border-border bg-surface p-3.5 shadow-sm @sm/app:p-4"><div className="flex items-center gap-2"><span className={`size-2 shrink-0 rounded-full ${metric.marker}`} /><p className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted @sm/app:text-xs">{metric.label}</p></div><p className={`mt-2 whitespace-nowrap text-[clamp(0.72rem,3.5cqi,1.125rem)] font-semibold leading-tight tabular-nums @sm/app:mt-3 ${metric.tone}`} title={metric.value}>{metric.value}</p></article>)}
          </section>

          <div className="grid grid-cols-1 items-start gap-4 @lg/app:grid-cols-2">
            <section aria-labelledby="cashflow-heading" className="rounded-xl border border-border bg-surface p-4 shadow-sm @sm/app:p-5">
              <div className="mb-6 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Wallet aria-hidden="true" className="size-5" /></span><div><h2 id="cashflow-heading" className="font-semibold">{isIndonesian ? "Arus kas bulanan" : "Monthly cash flow"}</h2><p className="mt-0.5 text-sm text-muted">{periodLabel}</p></div></div>
              <div className="space-y-5">
                {[{ label: isIndonesian ? "Pemasukan" : "Income", value: income, bar: "bg-income", text: "text-income" }, { label: isIndonesian ? "Pengeluaran" : "Expenses", value: expenses, bar: "bg-expense", text: "text-expense" }].map((item) => <div key={item.label}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium">{item.label}</span><span className={`shrink-0 font-semibold tabular-nums ${item.text}`}>{currency.format(item.value)}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-background"><div className={`h-full rounded-full transition-[width] duration-500 ${item.bar}`} style={{ width: `${item.value / maxAmount * 100}%` }} /></div></div>)}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-4"><span className="text-sm text-muted">{isIndonesian ? "Sisa setelah pengeluaran" : "Remaining after expenses"}</span><span className="font-semibold tabular-nums">{currency.format(savings)}</span></div>
            </section>

            <section aria-labelledby="category-heading" className="rounded-xl border border-border bg-surface p-4 shadow-sm @sm/app:p-5">
              <div className="mb-5 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-expense/10 text-expense"><CalendarDays aria-hidden="true" className="size-5" /></span><div><h2 id="category-heading" className="font-semibold">{isIndonesian ? "Pengeluaran per kategori" : "Expenses by category"}</h2><p className="mt-0.5 text-sm text-muted">{periodLabel}</p></div></div>
              {categoryBreakdown?.breakdown.filter((category) => Number(category.total_amount) > 0).length ? <div className="divide-y divide-border">{categoryBreakdown.breakdown.filter((category) => Number(category.total_amount) > 0).map((category) => { const percentage = Number(category.percentage); return <article key={category.category_id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-center gap-3"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color || "#64748b" }} aria-hidden="true" /><p className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</p><p className="shrink-0 text-sm font-semibold tabular-nums">{currency.format(Number(category.total_amount))}</p></div><div className="mt-2 flex items-center gap-2 pl-[22px]"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full" style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%`, backgroundColor: category.color || "#64748b" }} /></div><span className="w-12 text-right text-xs tabular-nums text-muted">{percentage.toFixed(1)}%</span></div></article>; })}</div> : <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center"><p className="text-sm font-medium">{isIndonesian ? "Belum ada pengeluaran" : "No expenses yet"}</p><p className="mt-1 text-sm text-muted">{isIndonesian ? "Data kategori akan muncul setelah transaksi dicatat." : "Category details will appear when you record expenses."}</p></div>}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
