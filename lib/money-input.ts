export function formatMoneyInput(value: string): string {
  const sanitized = value.replace(/[^\d,]/g, "");
  const decimalSeparatorIndex = sanitized.indexOf(",");
  const integerDigits =
    decimalSeparatorIndex === -1 ? sanitized : sanitized.slice(0, decimalSeparatorIndex);
  const fractionalDigits =
    decimalSeparatorIndex === -1
      ? ""
      : sanitized.slice(decimalSeparatorIndex + 1).replace(/,/g, "").slice(0, 2);
  const groupedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return decimalSeparatorIndex === -1
    ? groupedInteger
    : `${groupedInteger},${fractionalDigits}`;
}

export function parseMoneyInput(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return normalized === "" ? Number.NaN : Number(normalized);
}

export function formatMoneyValue(value: number | string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "";
  }

  const [integer, fraction] = amount.toFixed(2).replace(/\.?0+$/, "").split(".");
  return formatMoneyInput(fraction ? `${integer},${fraction}` : integer);
}
