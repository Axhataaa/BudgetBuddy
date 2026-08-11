import api from "../api/axios";

/**
 * Settings -> "Export My Data": downloads a complete ZIP archive of
 * everything the current user owns in BudgetBuddy (Excel workbook +
 * per-category JSON files + README), built server-side by
 * users/data_export_service.py.
 *
 * Deliberately its own file/function, not a reuse of
 * exportReportCsv()/exportReportExcel()/exportReportPdf()
 * (utils/exportReport.js) - those build a period-based financial
 * report client-side from already-fetched Reports data; this
 * downloads a complete, unfiltered account-data archive that the
 * backend builds and streams directly, matching the very different
 * purpose (data portability, not financial analysis).
 */
export async function downloadUserDataExport() {
  const response = await api.get("users/me/export-data/", {
    responseType: "blob",
  });

  // The backend sets Content-Disposition with the real filename
  // (BudgetBuddy_Data_Export_<date>.zip) - read it back rather than
  // hardcoding the date again on the frontend, so the two can never
  // drift out of sync.
  const disposition = response.headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : "BudgetBuddy_Data_Export.zip";

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
