export type Category = {
  id: number;
  user_id?: number | null;
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
  current_month_spent?: number | string;
  monthly_budget?: number | string | null;
  budget_used_percentage?: number | string | null;
  spending_change_percentage?: number | string | null;
};
