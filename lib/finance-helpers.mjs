export function normalizeTransactionType(value = "") {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "income" || normalized === "expense" || normalized === "transfer") {
    return normalized;
  }

  return "expense";
}

export function formatCurrency(value) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u00A0/g, " ");
}
