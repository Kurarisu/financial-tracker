"use client";

import { useLocale, useTranslations } from "next-intl";

export type DailyBalancePoint = {
  day: number;
  balance: number | null;
};

export default function DailyBalanceChart({
  data,
  netChange,
}: {
  data: DailyBalancePoint[];
  netChange: number;
}) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const currency = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
  const compact = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const points = data.filter(
    (point): point is DailyBalancePoint & { balance: number } =>
      point.balance !== null,
  );

  if (!points.length) {
    return (
      <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-xs">
        <h3 className="text-base font-bold text-foreground">{t("dailyBalance")}</h3>
        <div className="flex h-52 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-muted">{t("dailyTrendEmpty")}</p>
          <p className="mt-1 text-xs text-muted/80">{t("dailyTrendHint")}</p>
        </div>
      </section>
    );
  }

  const plot = { left: 72, right: 700, top: 18, bottom: 202 };
  const values = points.map((point) => point.balance);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max((rawMax - rawMin) * 0.12, Math.abs(rawMax) * 0.015, 1000);
  const min = rawMin - padding;
  const max = rawMax + padding;
  const x = (day: number) =>
    plot.left + ((day - 1) / Math.max(data.length - 1, 1)) * (plot.right - plot.left);
  const y = (balance: number) =>
    plot.bottom - ((balance - min) / (max - min)) * (plot.bottom - plot.top);
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.day)} ${y(point.balance)}`)
    .join(" ");
  const area = `${line} L ${x(points.at(-1)!.day)} ${plot.bottom} L ${x(points[0].day)} ${plot.bottom} Z`;
  const ticks = Array.from({ length: 5 }, (_, index) => min + ((max - min) * index) / 4);
  const dayLabels = data.filter(
    (point) => point.day === 1 || point.day % 5 === 0 || point.day === data.length,
  );
  const latest = points.at(-1)!;

  return (
    <section className="rounded-2xl border border-border/80 bg-surface p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t("cashFlow")}
          </p>
          <h3 className="mt-0.5 text-base font-bold text-foreground">{t("dailyBalance")}</h3>
          <p className="mt-1 text-xs text-muted">{t("dailyBalanceHint")}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
          <p className="text-[11px] text-muted">{t("netChange")}</p>
          <p className={`mt-0.5 text-sm font-bold tabular-nums ${netChange < 0 ? "text-rose-600" : "text-emerald-700"}`}>
            {netChange > 0 ? "+" : ""}{currency.format(netChange)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-sky-500" />
        <span className="text-xs font-medium text-muted">{t("closingBalance")}</span>
        <span className="ml-auto text-sm font-bold tabular-nums text-foreground">{currency.format(latest.balance)}</span>
      </div>

      <div className="mt-2 w-full overflow-hidden" role="img" aria-label={`${t("dailyBalance")}: ${currency.format(latest.balance)}`}>
        <svg viewBox="0 0 720 248" className="h-56 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="daily-balance-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {ticks.map((tick, index) => {
            const yPosition = y(tick);
            return (
              <g key={index}>
                <line x1={plot.left} x2={plot.right} y1={yPosition} y2={yPosition} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="4 5" />
                <text x={plot.left - 9} y={yPosition + 4} textAnchor="end" className="fill-muted" fontSize="11">{compact.format(tick)}</text>
              </g>
            );
          })}
          <path d={area} fill="url(#daily-balance-fill)" />
          <path d={line} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <circle cx={x(latest.day)} cy={y(latest.balance)} r="5" fill="#0ea5e9" stroke="white" strokeWidth="2">
            <title>{`${t("day")} ${latest.day}: ${currency.format(latest.balance)}`}</title>
          </circle>
          {dayLabels.map((point) => (
            <text key={point.day} x={x(point.day)} y="232" textAnchor="middle" className="fill-muted" fontSize="11">{point.day}</text>
          ))}
        </svg>
      </div>
      <div className="flex justify-between pl-[72px] text-[10px] text-muted">
        <span>{t("dayOfMonth")}</span><span>{data.length} {t("days")}</span>
      </div>
    </section>
  );
}
