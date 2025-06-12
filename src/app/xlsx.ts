// Utility to export test results to XLSX using SheetJS (js-xlsx)
// Only exports a single result row for now
import * as XLSX from 'xlsx';

export function saveResultToXLSX({
  fileName,
  algorithm,
  mode,
  runs,
  times,
  date,
}: {
  fileName: string;
  algorithm: string;
  mode: string;
  runs: number;
  times: number[];
  date: string;
}) {
  // Each run is a row
  const rows = times.map((time, idx) => ({
    File: fileName,
    Algorithm: algorithm,
    Mode: mode,
    Run: idx + 1,
    'Time (ms)': time.toFixed(2),
    Date: date,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results');
  const outName = `${fileName}-${algorithm}_${mode}_${runs}-${date}.xlsx`;
  XLSX.writeFile(wb, outName);
}
