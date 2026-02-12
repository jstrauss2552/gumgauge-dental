/**
 * Export data to CSV and trigger download.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (v: string | number): string => {
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const line = (row: (string | number)[]) => row.map(escape).join(",");
  const csv = [line(headers), ...rows.map(line)].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
