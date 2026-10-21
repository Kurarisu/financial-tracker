/**
 * Export monthly report as CSV (YYYY-MM.csv).
 */
export async function exportMonthAsCsv(month: number, year: number): Promise<Blob> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("auth_token") : null;
  const url = '/api/reports/export-month-directed';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ month, year }),
  });

  if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
  return await res.blob();
}

/**
 * Download CSV to file.
 */
export function downloadCsv(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}