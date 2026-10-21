"use client";

import { ChevronDown, Coins, Landmark, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

type AccountBalance = {
  id: number;
  name: string;
  type: string;
  current_balance: number | string;
  color?: string | null;
};

const typeOrder = ["cash", "bank", "ewallet", "investment", "other"];

export default function AccountBalances({ accounts, visible }: { accounts: AccountBalance[]; visible: boolean }) {
  const t = useTranslations("Dashboard");
  const accountText = useTranslations("Accounts");
  const locale = useLocale();
  const currency = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
  const grouped = accounts.reduce<Record<string, AccountBalance[]>>((groups, account) => {
    (groups[account.type] ??= []).push(account);
    return groups;
  }, {});
  const groups = Object.entries(grouped).sort(
    ([first], [second]) => typeOrder.indexOf(first) - typeOrder.indexOf(second),
  );
  const typeLabel = (type: string) => {
    if (type === "cash") return accountText("typeCash");
    if (type === "bank") return accountText("typeBank");
    if (type === "ewallet") return accountText("typeEwallet");
    if (type === "investment") return accountText("typeInvestment");
    return accountText("typeOther");
  };

  return (
    <details className="group mt-4 overflow-hidden rounded-xl border border-white/15 bg-white/5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300">
        <span>
          <span className="block text-sm font-semibold text-white">{t("balanceDetails")}</span>
          <span className="mt-0.5 block text-[11px] text-blue-100/70">{accountText("accountCount", { count: accounts.length })}</span>
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-blue-100 transition-transform group-open:rotate-180" />
      </summary>

      <div className="border-t border-white/10 px-3.5 py-3">
        {groups.length ? (
          <div className="grid gap-x-6 gap-y-4 @xl/app:grid-cols-2">
            {groups.map(([type, typeAccounts]) => {
              const Icon = type === "cash" ? Coins : type === "bank" ? Landmark : Wallet;
              const groupTotal = typeAccounts.reduce((sum, account) => sum + Number(account.current_balance), 0);
              return (
                <div key={type}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-blue-100/75">{typeLabel(type)}</span>
                    <span className="text-xs font-bold tabular-nums text-white">{visible ? currency.format(groupTotal) : "••••••"}</span>
                  </div>
                  <ul className="divide-y divide-white/10">
                    {typeAccounts.map((account) => (
                      <li key={account.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon aria-hidden="true" className="size-3.5 shrink-0 text-blue-100/60" />
                          <span className="truncate text-xs font-medium text-white/90">{account.name}</span>
                        </div>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-white">{visible ? currency.format(Number(account.current_balance)) : "••••••"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-2 text-center text-xs text-blue-100/75">{t("noAccountBalances")}</p>
        )}
      </div>
    </details>
  );
}
