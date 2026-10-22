import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ChevronRight, Plus } from "lucide-react";

type RecentTransaction = {
  id: number;
  type: "income" | "expense" | "transfer";
  amount: number | string;
  notes: string | null;
  transaction_date: string;
};

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function RecentTransactions({
  transactions,
}: {
  transactions: RecentTransaction[];
}) {
  const t = useTranslations("Dashboard");
  const actions = useTranslations("Actions");
  const locale = useLocale();
  const currency = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  return (
    <section className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-border/80 bg-surface p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t("activity")}
          </p>
          <h3 className="mt-0.5 text-base font-bold text-foreground">
            {t("recentTransactions")}
          </h3>
        </div>
        <Link
          aria-label={actions("viewAllTransactions")}
          className="inline-flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold
            text-muted transition-colors hover:bg-background hover:text-foreground
            focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-primary"
          href="/transactions"
          title={actions("viewAllTransactions")}
        >
          {actions("viewAllTransactions")}
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted py-6">{t("emptyTransactions")}</p>
      ) : (
        <div className="mt-4 min-w-0 space-y-2.5">
          {transactions.slice(0, 4).map((transaction) => {
            const amount = Number(transaction.amount);
            const isIncome = transaction.type === "income";
            const isExpense = transaction.type === "expense";

            return (
              <div
                className="flex min-w-0 items-center justify-between gap-2 rounded-xl border
                  border-border/60 bg-background/60 p-3 transition-colors hover:bg-background"
                key={transaction.id}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                      isIncome
                        ? "bg-emerald-100/70 text-emerald-700"
                        : isExpense
                          ? "bg-rose-100/70 text-rose-700"
                          : "bg-blue-100/70 text-blue-700"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="size-4" />
                    ) : isExpense ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowLeftRight className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {transaction.notes || t("untitledTransaction")}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-muted">
                      {t(isIncome ? "income" : isExpense ? "expenses" : "transfer")} ·{" "}
                      {formatDate(transaction.transaction_date, locale)}
                    </p>
                  </div>
                </div>

                <p
                  className={`shrink-0 text-right text-sm font-bold tabular-nums ${
                    isIncome ? "text-emerald-700" : isExpense ? "text-rose-700" : "text-foreground"
                  }`}
                >
                  {isIncome ? "+" : isExpense ? "-" : ""}
                  {currency.format(amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Link
        className="mt-4 flex w-full h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 text-white
          text-xs font-semibold shadow-xs transition-all hover:bg-slate-800
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        href="/transactions/new"
      >
        <Plus className="size-3.5" />
        {actions("addTransaction")}
      </Link>
    </section>
  );
}
