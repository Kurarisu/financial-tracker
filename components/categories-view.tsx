"use client";

import { useEffect, useState, type FormEvent } from "react";
import CategoryCreateForm from "@/components/categories/category-create-form";
import CategoryGroup from "@/components/categories/category-group";
import type { Category } from "@/components/categories/category-types";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatMoneyValue, parseMoneyInput } from "@/lib/money-input";
import LoadingBar from "@/components/ui/loading-bar";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};

export default function CategoriesView() {
  const t = useTranslations("Categories");
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetValues, setBudgetValues] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [type, setType] = useState<Category["type"]>("expense");
  const [color, setColor] = useState("#6B7280");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBudgetId, setSavingBudgetId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("auth_token");

    if (!token) {
      router.replace("/login");
      return () => controller.abort();
    }

    async function loadCategories() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/categories", {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        if (response.status === 401) {
          sessionStorage.removeItem("auth_token");
          router.replace("/login");
          return;
        }

        const result = (await response.json()) as ApiResponse<Category[]>;
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message ?? t("loadError"));
        }

        setCategories(result.data);
        setBudgetValues(
          Object.fromEntries(
            result.data
              .filter((category) => category.type === "expense")
              .map((category) => [
                category.id,
                category.monthly_budget == null
                  ? ""
                  : formatMoneyValue(category.monthly_budget),
              ]),
          ),
        );
      } catch (loadError) {
        if (
          !controller.signal.aborted &&
          !(loadError instanceof Error && loadError.name === "AbortError")
        ) {
          setError(loadError instanceof Error ? loadError.message : t("loadError"));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCategories();
    return () => controller.abort();
  }, [attempt, router, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("auth_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), type, color }),
      });

      if (response.status === 401) {
        sessionStorage.removeItem("auth_token");
        router.replace("/login");
        return;
      }

      const result = (await response.json()) as ApiResponse<Category>;
      if (!response.ok || !result.success || !result.data) {
        const validationMessage = Object.values(result.errors ?? {}).flat()[0];
        throw new Error(validationMessage ?? result.message ?? t("createError"));
      }

      const createdCategory = {
        ...result.data,
        current_month_spent: 0,
        monthly_budget: null,
        budget_used_percentage: null,
        spending_change_percentage: null,
      };
      setCategories((current) => [createdCategory, ...current]);
      setBudgetValues((current) => ({ ...current, [createdCategory.id]: "" }));
      setName("");
      setType("expense");
      setColor("#6B7280");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("createError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleBudgetSubmit(
    event: FormEvent<HTMLFormElement>,
    category: Category,
  ) {
    event.preventDefault();
    const token = sessionStorage.getItem("auth_token");
    const monthlyBudget = parseMoneyInput(budgetValues[category.id] ?? "");

    if (!token) {
      router.replace("/login");
      return;
    }
    if (!Number.isFinite(monthlyBudget) || monthlyBudget < 0) {
      setError(t("invalidBudget"));
      return;
    }

    setSavingBudgetId(category.id);
    setError("");

    try {
      const response = await fetch(`/api/categories/${category.id}/budget`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ monthly_budget: monthlyBudget }),
      });

      if (response.status === 401) {
        sessionStorage.removeItem("auth_token");
        router.replace("/login");
        return;
      }

      const result = (await response.json()) as ApiResponse<{
        category_id: number;
        monthly_budget: number | string;
      }>;
      if (!response.ok || !result.success || !result.data) {
        const validationMessage = Object.values(result.errors ?? {}).flat()[0];
        throw new Error(validationMessage ?? result.message ?? t("saveBudgetError"));
      }

      const savedBudget = Number(result.data.monthly_budget);
      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? {
                ...item,
                monthly_budget: savedBudget,
                budget_used_percentage:
                  savedBudget > 0
                    ? (Number(item.current_month_spent ?? 0) / savedBudget) * 100
                    : null,
              }
            : item,
        ),
      );
      setBudgetValues((current) => ({
        ...current,
        [category.id]: formatMoneyValue(savedBudget),
      }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("saveBudgetError"));
    } finally {
      setSavingBudgetId(null);
    }
  }

  const expenseCategories = categories.filter((category) => category.type === "expense");
  const incomeCategories = categories.filter((category) => category.type === "income");

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-7 @sm/app:px-8 @sm/app:py-9">
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {t("workspace")}
        </p>
        <h2 className="text-2xl font-semibold tracking-normal @sm/app:text-[28px]">
          {t("title")}
        </h2>
      </div>

      <CategoryCreateForm
        name={name}
        type={type}
        color={color}
        saving={saving}
        onNameChange={setName}
        onTypeChange={setType}
        onColorChange={setColor}
        onSubmit={handleSubmit}
        labels={{
          add: t("addCategory"),
          name: t("name"),
          type: t("type"),
          expense: t("expense"),
          income: t("income"),
          color: t("color"),
          saving: t("saving"),
        }}
      />

      {error ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <span>{error}</span>
          {!loading ? (
            <button
              className="font-semibold underline"
              onClick={() => setAttempt((current) => current + 1)}
              type="button"
            >
              {t("retry")}
            </button>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4" role="status" aria-busy="true">
          <LoadingBar />
          <div className="grid gap-6 @lg/app:grid-cols-2">
            {[1, 2].map((col) => (
              <div key={col} className="rounded-xl border border-border/80 bg-surface p-5 space-y-4">
                <div className="h-5 w-24 rounded-full bg-slate-200 animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="p-3 rounded-lg border border-border/60 bg-background/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-4 rounded-full bg-slate-200 animate-pulse" />
                          <div className="h-4 w-28 rounded-full bg-slate-200 animate-pulse" />
                        </div>
                        <div className="h-4 w-16 rounded-lg bg-slate-200 animate-pulse" />
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 @lg/app:grid-cols-2">
          <CategoryGroup
            title={t("expense")}
            empty={t("emptyExpense")}
            categories={expenseCategories}
            budgetValues={budgetValues}
            savingBudgetId={savingBudgetId}
            onBudgetChange={(id, value) =>
              setBudgetValues((current) => ({ ...current, [id]: value }))
            }
            onBudgetSubmit={handleBudgetSubmit}
            budgetLabel={t("monthlyBudget")}
            spentLabel={t("currentMonthSpent")}
            saveBudgetLabel={t("saveBudget")}
            savingLabel={t("saving")}
            noBudgetLabel={t("budgetNotSet")}
          />
          <CategoryGroup
            title={t("income")}
            empty={t("emptyIncome")}
            categories={incomeCategories}
          />
        </div>
      )}
    </div>
  );
}
