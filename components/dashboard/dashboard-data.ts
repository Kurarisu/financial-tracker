import type { DailyBalancePoint } from "@/components/dashboard/daily-balance-chart";

export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type DashboardSummary = {
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

export type CashflowPoint = {
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

export type TransactionPage = {
  data: DashboardTransaction[];
  last_page: number;
};

export function buildDailyBalance(
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
