/**
 * Export data to CSV and trigger download
 */
export function exportCsv(filename: string, headers: string[], rows: string[][]) {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
