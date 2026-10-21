"use client";

import { ArrowLeft } from "lucide-react";
import TransactionFields, { type TransactionFormValues } from "@/components/transaction-fields";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { parseMoneyInput } from "@/lib/money-input";

type Account = { id: number; name: string; type?: string; account_number?: string | null };
type Category = { id: number; name: string; type?: string };

const initialForm: TransactionFormValues = {
  type: "expense",
  amount: "",
  transaction_date: new Date().toISOString().slice(0, 10),
  account_id: "",
  category_id: "",
  to_account_id: "",
  notes: "",
};

export default function TransactionForm() {
  const t = useTranslations("Transactions");
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const controller = new AbortController();
    const token = sessionStorage.getItem("auth_token");

    if (!token) {
      router.replace("/login");
      return () => controller.abort();
    }

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");
        const [accountsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/accounts", {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          fetch(`/api/categories?type=${encodeURIComponent(form.type)}&include_defaults=1`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
        ]);

        if (controller.signal.aborted) return;

        if (accountsResponse.status === 401 || categoriesResponse.status === 401) {
          sessionStorage.removeItem("auth_token");
          router.replace("/login");
          return;
        }

        const [accountsPayload, categoriesPayload] = await Promise.all([
          accountsResponse.json() as Promise<{
            success?: boolean;
            message?: string;
            data?: { accounts?: Account[] };
          }>,
          categoriesResponse.json() as Promise<{
            success?: boolean;
            message?: string;
            data?: Category[];
          }>,
        ]);

        if (controller.signal.aborted) return;
        if (!accountsResponse.ok || !accountsPayload.success) {
          throw new Error(accountsPayload.message ?? "Unable to load account and category data.");
        }
        if (!categoriesResponse.ok || !categoriesPayload.success) {
          throw new Error(categoriesPayload.message ?? "Unable to load account and category data.");
        }

        const nextAccounts = accountsPayload?.data?.accounts ?? accountsPayload?.data ?? [];
        const nextCategories = categoriesPayload?.data ?? [];

        setAccounts(Array.isArray(nextAccounts) ? nextAccounts : []);
        setCategories(Array.isArray(nextCategories) ? nextCategories : []);
        setError("");
      } catch (loadError) {
        if (
          controller.signal.aborted ||
          (loadError instanceof Error && loadError.name === "AbortError")
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load account and category data.",
        );
      } finally {
        if (!controller.signal.aborted) setLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => controller.abort();
  }, [form.type, router]);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = sessionStorage.getItem("auth_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const safeAmount = parseMoneyInput(form.amount);

    if (!form.transaction_date || !Number.isFinite(safeAmount) || safeAmount <= 0) {
      setError(t("validationAmount"));
      return;
    }

    if (form.type === "transfer") {
      if (!form.account_id || !form.to_account_id || String(form.account_id) === String(form.to_account_id)) {
        setError(t("validationTransfer"));
        return;
      }
    } else if (!form.account_id || !form.category_id) {
      setError(t("validationCategory"));
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      type: form.type,
      amount: safeAmount,
      transaction_date: form.transaction_date,
      notes: form.notes.trim() || null,
      account_id: form.type === "transfer" ? Number(form.account_id) : Number(form.account_id),
      category_id: form.type === "transfer" ? undefined : Number(form.category_id),
      to_account_id: form.type === "transfer" ? Number(form.to_account_id) : undefined,
    };

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { success?: boolean; message?: string; errors?: Record<string, string[]> };

      if (!response.ok || !result.success) {
        const validationError = result.errors
          ? Object.values(result.errors).flat().join(" ")
          : result.message ?? "Unable to save transaction.";
        throw new Error(validationError);
      }

      router.replace("/transactions");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save transaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[820px] px-5 py-7 @sm/app:px-8 @sm/app:py-9">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {t("workspace")}
          </p>
          <h2 className="text-2xl font-semibold tracking-normal @sm/app:text-[28px]">
            {t("newTransaction")}
          </h2>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground"
          href="/transactions"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("back")}
        </Link>
      </div>

      <TransactionFields
        accounts={accounts}
        categories={categories}
        form={form}
        saving={saving}
        loadingOptions={loadingOptions}
        error={error}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
