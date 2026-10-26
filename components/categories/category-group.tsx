"use client";

import type { FormEvent } from "react";
import { Tag } from "lucide-react";
import { formatCurrency } from "@/lib/finance-helpers.mjs";
import { formatMoneyInput } from "@/lib/money-input";
import type { Category } from "@/components/categories/category-types";

export default function CategoryGroup({
  title,
  empty,
  categories,
  budgetValues,
  savingBudgetId,
  onBudgetChange,
  onBudgetSubmit,
  budgetLabel,
  spentLabel,
  saveBudgetLabel,
  savingLabel,
  noBudgetLabel,
  spendingChangeLabel,
  nearBudgetLabel,
  overBudgetLabel,
}: {
  title: string;
  empty: string;
  categories: Category[];
  budgetValues?: Record<number, string>;
  savingBudgetId?: number | null;
  onBudgetChange?: (id: number, value: string) => void;
  onBudgetSubmit?: (event: FormEvent<HTMLFormElement>, category: Category) => void;
  budgetLabel?: string;
  spentLabel?: string;
  saveBudgetLabel?: string;
  savingLabel?: string;
  noBudgetLabel?: string;
  spendingChangeLabel?: string;
  nearBudgetLabel?: string;
  overBudgetLabel?: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {categories.length === 0 ? (
        <p className="py-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => {
            const usedPercentage = Math.max(0, Number(category.budget_used_percentage ?? 0));
            const isOverBudget = Number(category.monthly_budget ?? 0) > 0 && usedPercentage >= 100;
            const isNearBudget = Number(category.monthly_budget ?? 0) > 0 && usedPercentage >= 80 && usedPercentage < 100;
            return (
            <li className="rounded-xl border border-border p-4" key={category.id}>
              <div className="flex items-center gap-3">
                <span
                  className="flex size-9 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: `${category.color ?? "#6B7280"}22`,
                    color: category.color ?? "#6B7280",
                  }}
                >
                  <Tag aria-hidden="true" className="size-4" />
                </span>
                <span className="text-sm font-medium text-foreground">{category.name}</span>
              </div>

              {onBudgetSubmit && onBudgetChange ? (
                <div className="mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span>
                      {spentLabel}: {formatCurrency(Number(category.current_month_spent ?? 0))}
                    </span>
                    {category.spending_change_percentage != null ? (
                      <span>
                        {spendingChangeLabel?.replace(
                          "{percent}",
                          String(category.spending_change_percentage),
                        )}
                      </span>
                    ) : null}
                  </div>

                  {category.monthly_budget != null ? (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-muted">
                        <span>
                          {budgetLabel}: {formatCurrency(Number(category.monthly_budget))}
                        </span>
                        {Number(category.monthly_budget) > 0 ? (
                          <span>
                            {Number(category.budget_used_percentage ?? 0).toFixed(1)}%
                          </span>
                        ) : null}
                      </div>
                      {Number(category.monthly_budget) > 0 ? (
                        <div className="h-2 rounded-full bg-background">
                          <div
                            className={`h-2 rounded-full transition-[width] duration-300 ${isOverBudget ? "bg-expense" : isNearBudget ? "bg-amber-500" : "bg-brand"}`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, Number(category.budget_used_percentage ?? 0)),
                              )}%`,
                            }}
                          />
                        </div>
                      ) : null}
                      {isOverBudget || isNearBudget ? <p className={`mt-2 text-xs font-semibold ${isOverBudget ? "text-expense" : "text-amber-700"}`} role="status">{isOverBudget ? overBudgetLabel : nearBudgetLabel}</p> : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted">{noBudgetLabel}</p>
                  )}

                  <form
                    className="mt-4 flex flex-wrap gap-2"
                    onSubmit={(event) => onBudgetSubmit(event, category)}
                  >
                    <label className="sr-only" htmlFor={`budget-${category.id}`}>
                      {budgetLabel}
                    </label>
                    <input
                      className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none"
                      id={`budget-${category.id}`}
                      inputMode="decimal"
                      onChange={(event) =>
                        onBudgetChange(category.id, formatMoneyInput(event.target.value))
                      }
                      placeholder={budgetLabel}
                      required
                      type="text"
                      value={budgetValues?.[category.id] ?? ""}
                    />
                    <button
                      className="h-10 rounded-md bg-brand px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={savingBudgetId === category.id}
                      type="submit"
                    >
                      {savingBudgetId === category.id ? savingLabel : saveBudgetLabel}
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
