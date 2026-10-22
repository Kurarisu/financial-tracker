"use client";

import { Loader2 } from "lucide-react";
import LoadingBar from "@/components/ui/loading-bar";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { formatMoneyInput } from "@/lib/money-input";
import type { ReactNode } from "react";

type Account = { id: number; name: string; type?: string; account_number?: string | null };
type Category = { id: number; name: string; type?: string };
export type TransactionFormValues = {
  type: string;
  amount: string;
  transaction_date: string;
  account_id: string;
  category_id: string;
  to_account_id: string;
  notes: string;
};

export default function TransactionFields({
  accounts,
  categories,
  form,
  saving,
  loadingOptions,
  error,
  onFieldChange,
  onSubmit,
  receiptSection,
  submitLabel,
  isUpdate = false,
}: {
  accounts: Account[];
  categories: Category[];
  form: TransactionFormValues;
  saving: boolean;
  loadingOptions: boolean;
  error: string;
  onFieldChange: (field: keyof TransactionFormValues, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  receiptSection: ReactNode;
  submitLabel?: string;
  isUpdate?: boolean;
}) {
  const t = useTranslations("Transactions");
  const isTransfer = form.type === "transfer";
  const updateField = onFieldChange;
  return (
    <form className="space-y-5 rounded-md border border-border bg-surface p-5 @sm/app:p-6" onSubmit={onSubmit}>
        {(loadingOptions || saving) && <LoadingBar className="mb-2" />}
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 @md/app:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("type")}</span>
            <select
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              onChange={(event) => updateField("type", event.target.value)}
              value={form.type}
            >
              <option value="expense">{t("filterExpense")}</option>
              <option value="income">{t("filterIncome")}</option>
              <option value="transfer">{t("filterTransfer")}</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("amount")}</span>
            <input
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              inputMode="decimal"
              onChange={(event) => updateField("amount", formatMoneyInput(event.target.value))}
              placeholder="0"
              type="text"
              value={form.amount}
            />
          </label>
        </div>

        <div className="grid gap-5 @md/app:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{t("transactionDate")}</span>
            <input
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              onChange={(event) => updateField("transaction_date", event.target.value)}
              type="date"
              value={form.transaction_date}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            <span>{isTransfer ? t("sourceAccount") : t("account")}</span>
            <select
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              onChange={(event) => updateField("account_id", event.target.value)}
              value={form.account_id}
            >
              <option value="">{t("selectAccount")}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isTransfer ? (
          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>{t("destinationAccount")}</span>
            <select
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              onChange={(event) => updateField("to_account_id", event.target.value)}
              value={form.to_account_id}
            >
              <option value="">{t("selectAccount")}</option>
              {accounts
                .filter((account) => String(account.id) !== String(form.account_id))
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </select>
          </label>
        ) : (
          <label className="block space-y-2 text-sm font-medium text-foreground">
            <span>{t("category")}</span>
            <select
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
              onChange={(event) => updateField("category_id", event.target.value)}
              disabled={categories.length === 0}
              value={form.category_id}
            >
              <option value="">{categories.length === 0 ? t("noCategories") : t("selectCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categories.length === 0 ? (
              <p className="text-xs font-normal text-muted">
                {t("createCategoryFirst")} <Link className="font-semibold text-primary underline underline-offset-2" href="/categories">{t("createCategoryLink")}</Link>
              </p>
            ) : null}
          </label>
        )}

        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>{t("notes")}</span>
          <textarea
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
            onChange={(event) => updateField("notes", event.target.value)}
            rows={4}
            value={form.notes}
          />
        </label>

        {receiptSection}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            className="inline-flex h-10 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground"
            href="/transactions"
          >
            {t("cancel")}
          </Link>
          <button
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${isUpdate ? "bg-primary hover:bg-primary-hover" : "bg-brand hover:bg-brand-hover"}`}
            disabled={saving || loadingOptions}
            type="submit"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? t("saving") : submitLabel ?? t("saveTransaction")}
          </button>
        </div>
    </form>
  );
}
