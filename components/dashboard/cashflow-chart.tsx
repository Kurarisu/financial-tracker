import { useLocale, useTranslations } from "next-intl";

type CashflowPoint = {
  period: string;
  income: number | string;
  expense: number | string;
  net: number | string;
};

function formatPeriod(period: string, locale: string) {
  const [year, month] = period.split("-").map(Number);

  if (!year || !month) return period;

  return new Intl.DateTimeFormat(locale, { month: "short" }).format(
    new Date(year, month - 1, 1),
  );
}

export default function CashflowChart({ data }: { data: CashflowPoint[] }) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const currency = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
  const maxCashflow = Math.max(
    0,
    ...data.flatMap((point) => [Number(point.income), Number(point.expense)]),
  );

  return (
    <section className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-border/80 bg-surface p-4 shadow-xs sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t("cashFlow")}
          </p>
          <h3 className="mt-0.5 text-base font-bold text-foreground">{t("incomeExpenses")}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
            <span aria-hidden="true" className="size-2 rounded-full bg-emerald-600" />
            {t("income")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
            <span aria-hidden="true" className="size-2 rounded-full bg-rose-600" />
            {t("expenses")}
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-muted">{t("emptyCashFlow")}</p>
          <p className="mt-1 text-xs text-muted/80">{t("cashFlowHint")}</p>
        </div>
      ) : (
        <div className="mt-6 flex h-48 min-w-0 w-full items-end gap-2 sm:gap-3">
          {data.map((point) => {
            const income = Number(point.income);
            const expense = Number(point.expense);
            const incomeHeight = maxCashflow ? Math.max(income > 0 ? 6 : 0, (income / maxCashflow) * 100) : 0;
            const expenseHeight = maxCashflow ? Math.max(expense > 0 ? 6 : 0, (expense / maxCashflow) * 100) : 0;

            return (
              <div
                key={point.period}
                className="group flex h-full min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div className="relative flex min-h-0 w-full flex-1 items-end justify-center gap-1.5 rounded-xl bg-slate-50/80 p-1">
                  {/* Income bar */}
                  <div className="relative flex h-full w-2.5 sm:w-3 items-end">
                    <div
                      aria-label={`${t("income")}: ${currency.format(income)}`}
                      className="w-full rounded-full bg-emerald-500 transition-all group-hover:bg-emerald-600"
                      style={{ height: `${incomeHeight}%` }}
                      title={`${t("income")}: ${currency.format(income)}`}
                    />
                  </div>
                  {/* Expense bar */}
                  <div className="relative flex h-full w-2.5 sm:w-3 items-end">
                    <div
                      aria-label={`${t("expenses")}: ${currency.format(expense)}`}
                      className="w-full rounded-full bg-rose-500 transition-all group-hover:bg-rose-600"
                      style={{ height: `${expenseHeight}%` }}
                      title={`${t("expenses")}: ${currency.format(expense)}`}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-muted group-hover:text-foreground transition-colors">
                  {formatPeriod(point.period, locale)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
