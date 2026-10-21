export type TransactionType = "income" | "expense";

export type MockTransaction = {
  id: number;
  title: string;
  category: string;
  account: string;
  date: string;
  type: TransactionType;
  amount: number;
  status: "completed" | "pending";
};

export const mockSummary = {
  totalBalance: 18425000,
  incomeThisMonth: 9200000,
  expensesThisMonth: 3875000,
  trend: [
    { month: "Jan", value: 42 },
    { month: "Feb", value: 58 },
    { month: "Mar", value: 48 },
    { month: "Apr", value: 66 },
    { month: "May", value: 61 },
    { month: "Jun", value: 74 },
  ],
};

export const mockTransactions: MockTransaction[] = [
  {
    id: 1,
    title: "Salary deposit",
    category: "Salary",
    account: "Main account",
    date: "2026-09-28",
    type: "income",
    amount: 5200000,
    status: "completed",
  },
  {
    id: 2,
    title: "Rent payment",
    category: "Housing",
    account: "Main account",
    date: "2026-09-25",
    type: "expense",
    amount: 1800000,
    status: "completed",
  },
  {
    id: 3,
    title: "Coffe shop",
    category: "Food & Drinks",
    account: "Cash wallet",
    date: "2026-09-22",
    type: "expense",
    amount: 125000,
    status: "completed",
  },
  {
    id: 4,
    title: "Freelance client",
    category: "Side income",
    account: "Savings",
    date: "2026-09-18",
    type: "income",
    amount: 1800000,
    status: "pending",
  },
  {
    id: 5,
    title: "Grocery purchase",
    category: "Groceries",
    account: "Main account",
    date: "2026-09-15",
    type: "expense",
    amount: 680000,
    status: "completed",
  },
  {
    id: 6,
    title: "Internet bill",
    category: "Utilities",
    account: "Main account",
    date: "2026-09-10",
    type: "expense",
    amount: 240000,
    status: "completed",
  },
];

export type MockAccount = {
  id: number;
  name: string;
  type: string;
  balance: number;
  percentage: number;
  updatedAt: string;
};

export type MockCategory = {
  id: number;
  name: string;
  spent: number;
  budget: number;
  percent: number;
  trend: string;
};

export type ReportMetric = {
  label: string;
  value: number;
  change: string;
};

export const mockAccounts: MockAccount[] = [
  {
    id: 1,
    name: "Main account",
    type: "Checking",
    balance: 12450000,
    percentage: 68,
    updatedAt: "2 hours ago",
  },
  {
    id: 2,
    name: "Savings",
    type: "Emergency fund",
    balance: 8900000,
    percentage: 52,
    updatedAt: "Today",
  },
  {
    id: 3,
    name: "Cash wallet",
    type: "Daily spending",
    balance: 2150000,
    percentage: 34,
    updatedAt: "Yesterday",
  },
];

export const mockCategories: MockCategory[] = [
  { id: 1, name: "Housing", spent: 1800000, budget: 2600000, percent: 69, trend: "+4.5%" },
  { id: 2, name: "Food & Drinks", spent: 930000, budget: 1200000, percent: 78, trend: "+2.1%" },
  { id: 3, name: "Transportation", spent: 420000, budget: 700000, percent: 60, trend: "-1.3%" },
  { id: 4, name: "Utilities", spent: 360000, budget: 500000, percent: 72, trend: "+1.5%" },
  { id: 5, name: "Shopping", spent: 610000, budget: 900000, percent: 68, trend: "+6.2%" },
];

export const mockReports: {
  overview: ReportMetric[];
  monthlyCashFlow: { month: string; income: number; expense: number }[];
} = {
  overview: [
    { label: "Net cash flow", value: 5320000, change: "+12.4%" },
    { label: "Savings rate", value: 28, change: "+3.1%" },
    { label: "Expense ratio", value: 42, change: "-2.2%" },
    { label: "Top category", value: 1800000, change: "Housing" },
  ],
  monthlyCashFlow: [
    { month: "Jan", income: 4600000, expense: 2900000 },
    { month: "Feb", income: 4900000, expense: 3100000 },
    { month: "Mar", income: 5200000, expense: 3350000 },
    { month: "Apr", income: 5400000, expense: 3400000 },
    { month: "May", income: 6100000, expense: 3800000 },
    { month: "Jun", income: 6700000, expense: 3900000 },
  ],
};
