"use client";

import { ArrowLeft, CircleAlert, FileImage, Loader2, RotateCcw } from "lucide-react";
import TransactionFields, { type TransactionFormValues } from "@/components/transaction-fields";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { formatMoneyInput, formatMoneyValue, parseMoneyInput } from "@/lib/money-input";

type Account = { id: number; name: string; type?: string; account_number?: string | null };
type Category = { id: number; name: string; type?: string };
type TransactionRecord = {
  id: number;
  type: string;
  amount: number | string;
  transaction_date: string;
  notes?: string | null;
  account_id: number | string;
  category_id?: number | string | null;
  to_account_id?: number | string | null;
};
type TransactionPayload = {
  type: string;
  amount: number;
  transaction_date: string;
  notes: string | null;
  account_id: number;
  category_id?: number;
  to_account_id?: number;
  receipt_token?: string;
};

const initialForm: TransactionFormValues = {
  type: "expense",
  amount: "",
  transaction_date: new Date().toISOString().slice(0, 10),
  account_id: "",
  category_id: "",
  to_account_id: "",
  notes: "",
};

export default function TransactionForm({ transactionId }: { transactionId?: string }) {
  const t = useTranslations("Transactions");
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receiptToken, setReceiptToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [originalTransaction, setOriginalTransaction] = useState<TransactionRecord | null>(null);
  const [pendingPayload, setPendingPayload] = useState<TransactionPayload | null>(null);

  useEffect(() => () => {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
  }, [receiptPreview]);

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
        const [accountsResponse, categoriesResponse, transactionResponse] = await Promise.all([
          fetch("/api/accounts", {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          fetch(`/api/categories?type=${encodeURIComponent(form.type)}&include_defaults=1`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          transactionId
            ? fetch(`/api/transactions/${transactionId}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, signal: controller.signal })
            : Promise.resolve(null),
        ]);

        if (controller.signal.aborted) return;

        if (accountsResponse.status === 401 || categoriesResponse.status === 401 || transactionResponse?.status === 401) {
          sessionStorage.removeItem("auth_token");
          router.replace("/login");
          return;
        }

        const [accountsPayload, categoriesPayload, transactionPayload] = await Promise.all([
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
          transactionResponse ? transactionResponse.json() as Promise<{ success?: boolean; message?: string; data?: TransactionRecord }> : Promise.resolve(null),
        ]);

        if (controller.signal.aborted) return;
        if (!accountsResponse.ok || !accountsPayload.success) {
          throw new Error(accountsPayload.message ?? "Unable to load account and category data.");
        }
        if (!categoriesResponse.ok || !categoriesPayload.success) {
          throw new Error(categoriesPayload.message ?? "Unable to load account and category data.");
        }
        if (transactionResponse && (!transactionResponse.ok || !transactionPayload?.success || !transactionPayload.data)) {
          throw new Error(transactionPayload?.message ?? "Unable to load this transaction.");
        }

        const nextAccounts = accountsPayload?.data?.accounts ?? accountsPayload?.data ?? [];
        const nextCategories = categoriesPayload?.data ?? [];

        setAccounts(Array.isArray(nextAccounts) ? nextAccounts : []);
        setCategories(Array.isArray(nextCategories) ? nextCategories : []);
        if (transactionPayload?.data) {
          const transaction = transactionPayload.data;
          setOriginalTransaction(transaction);
          setForm({
            type: transaction.type,
            amount: formatMoneyValue(transaction.amount),
            transaction_date: transaction.transaction_date.slice(0, 10),
            account_id: String(transaction.account_id),
            category_id: transaction.category_id == null ? "" : String(transaction.category_id),
            to_account_id: transaction.to_account_id == null ? "" : String(transaction.to_account_id),
            notes: transaction.notes ?? "",
          });
        }
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
  }, [form.type, router, transactionId]);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function scanReceipt() {
    if (!receipt) return;
    const token = sessionStorage.getItem("auth_token");
    if (!token) { router.replace("/login"); return; }
    setScanning(true);
    setScanMessage("");
    setError("");
    setReceiptToken("");
    try {
      const body = new FormData();
      body.append("receipt", receipt);
      const response = await fetch("/api/receipts/scan", {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        body,
      });
      const responseText = await response.text();
      let result: {
        success?: boolean; message?: string;
        data?: { receipt_token?: string; extracted?: { amount?: number | string | null; transaction_date?: string | null; notes?: string | null; type?: string | null; category_id?: number | null; confidence?: Record<string, number> } };
      };
      try {
        result = JSON.parse(responseText) as typeof result;
      } catch {
        if (response.status === 413) {
          throw new Error("Receipt image is larger than the API upload limit. The backend must be rebuilt with the updated Docker upload settings; images up to 10 MB are supported.");
        }
        const source = response.headers.get("content-type")?.includes("text/html")
          ? "backend API returned an HTML page"
          : "backend API returned an invalid response";
        throw new Error(`Receipt scan failed (HTTP ${response.status}): ${source}. Check that the Laravel API is running the latest code and that API_BASE_URL points to it.`);
      }
      if (response.status === 401) { sessionStorage.removeItem("auth_token"); router.replace("/login"); return; }
      if (!response.ok || !result.success || !result.data?.receipt_token) throw new Error(result.message ?? "Receipt scanning failed.");
      setReceiptToken(result.data.receipt_token);
      const extracted = result.data.extracted;
      if (extracted?.amount != null) updateField("amount", formatMoneyInput(String(extracted.amount).replace(".", ",")));
      if (extracted?.transaction_date) updateField("transaction_date", extracted.transaction_date.slice(0, 10));
      if (extracted?.notes) updateField("notes", extracted.notes);
      if (extracted?.type === "income" || extracted?.type === "expense") updateField("type", extracted.type);
      if (extracted?.category_id != null) updateField("category_id", String(extracted.category_id));
      setScanMessage("Pemindaian selesai. Periksa dan koreksi saran sebelum menyimpan transaksi.");
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Receipt scanning failed. You can still enter the transaction manually.");
    } finally { setScanning(false); }
  }

  function clearReceipt() {
    setReceipt(null); setReceiptToken(""); setScanMessage(""); setReceiptPreview("");
  }

  async function persistTransaction(payload: TransactionPayload) {
    const token = sessionStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch(transactionId ? `/api/transactions/${transactionId}` : "/api/transactions", {
        method: transactionId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { success?: boolean; message?: string; errors?: Record<string, string[]> };
      if (!response.ok || !result.success) {
        const validationError = result.errors
          ? Object.values(result.errors).flat().join(" ")
          : result.message ?? (transactionId ? "Unable to update transaction." : "Unable to save transaction.");
        throw new Error(validationError);
      }
      router.replace("/transactions");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save transaction.");
    } finally {
      setSaving(false);
      setPendingPayload(null);
    }
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

    setError("");

    const payload: TransactionPayload = {
      type: form.type,
      amount: safeAmount,
      transaction_date: form.transaction_date,
      notes: form.notes.trim() || null,
      account_id: Number(form.account_id),
      category_id: form.type === "transfer" ? undefined : Number(form.category_id),
      to_account_id: form.type === "transfer" ? Number(form.to_account_id) : undefined,
      ...(!transactionId ? { receipt_token: receiptToken || undefined } : {}),
    };

    const balanceChanges = originalTransaction && (
      originalTransaction.type !== payload.type ||
      Number(originalTransaction.amount) !== payload.amount ||
      String(originalTransaction.account_id) !== String(payload.account_id) ||
      String(originalTransaction.to_account_id ?? "") !== String(payload.to_account_id ?? "")
    );
    if (transactionId && balanceChanges) {
      setPendingPayload(payload);
      return;
    }
    await persistTransaction(payload);
  }

  return (
    <div className="mx-auto w-full max-w-[820px] px-5 py-7 @sm/app:px-8 @sm/app:py-9">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {t("workspace")}
          </p>
          <h2 className="text-2xl font-semibold tracking-normal @sm/app:text-[28px]">
            {transactionId ? t("editTransaction") : t("newTransaction")}
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
        submitLabel={transactionId ? t("updateTransaction") : t("saveTransaction")}
        isUpdate={Boolean(transactionId)}
        receiptSection={transactionId ? null : (
          <section className="space-y-4 border-t border-border pt-5" aria-label="Tambah struk">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Tambah struk</h3>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">Opsional</span>
              </div>
              <p className="mt-1 text-sm text-muted">Pindai struk belanja, bukti transfer, invoice, atau kuitansi. Hasil pindai bisa diperiksa dan diubah sebelum transaksi disimpan.</p>
              <p className="mt-2 text-xs text-muted">Format JPG, PNG, atau WebP · Maksimal 10 MB</p>
            </div>
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-center text-sm font-medium hover:bg-background">
              <FileImage aria-hidden="true" className="size-4 shrink-0" /> {receipt ? "Pilih foto lain" : "Pilih atau ambil foto struk"}
              <input accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                if (selected && selected.size > 10 * 1024 * 1024) { setError("Ukuran foto struk maksimal 10 MB."); event.target.value = ""; return; }
                setError("");
                if (receiptPreview) URL.revokeObjectURL(receiptPreview);
                setReceipt(selected);
                setReceiptPreview(selected ? URL.createObjectURL(selected) : "");
                setReceiptToken(""); setScanMessage("");
              }} type="file" />
            </label>
            {receiptPreview && <div className="flex flex-wrap items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Pratinjau struk" className="max-h-64 max-w-full rounded border border-border object-contain" src={receiptPreview} />
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium disabled:opacity-60" disabled={scanning} onClick={scanReceipt} type="button">
                  {scanning ? <Loader2 className="size-4 animate-spin" /> : receiptToken ? <RotateCcw className="size-4" /> : null}{scanning ? "Memindai…" : receiptToken ? "Pindai ulang" : "Pindai struk"}
                </button>
                <button className="h-10 rounded-md px-3 text-sm text-muted underline" disabled={scanning} onClick={clearReceipt} type="button">Hapus foto</button>
              </div>
            </div>}
            {scanMessage && <p className="text-sm text-green-700">{scanMessage}</p>}
          </section>
        )}
      />
      {pendingPayload && originalTransaction && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 @sm/app:items-center @sm/app:p-4" role="presentation">
          <section aria-labelledby="balance-change-title" aria-modal="true" className="w-full max-w-md rounded-t-2xl border border-border bg-surface p-5 shadow-2xl @sm/app:rounded-xl @sm/app:p-6" role="alertdialog">
            <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <CircleAlert aria-hidden="true" className="size-5" />
            </div>
            <h3 className="text-lg font-semibold" id="balance-change-title">{t("balanceChangeTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{t("balanceChangeMessage")}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-background p-3 text-sm">
              <div><p className="text-xs text-muted">{t("previousAmount")}</p><p className="mt-1 font-semibold">{formatMoneyValue(originalTransaction.amount)}</p></div>
              <div><p className="text-xs text-muted">{t("newAmount")}</p><p className="mt-1 font-semibold">{formatMoneyValue(pendingPayload.amount)}</p></div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 @sm/app:flex-row @sm/app:justify-end">
              <button className="h-10 rounded-md border border-border px-4 text-sm font-medium" disabled={saving} onClick={() => setPendingPayload(null)} type="button">{t("cancel")}</button>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={() => void persistTransaction(pendingPayload)} type="button">
                {saving && <Loader2 className="size-4 animate-spin" />}{saving ? t("saving") : t("confirmUpdate")}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
