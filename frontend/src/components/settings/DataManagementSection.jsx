import { useState } from "react";
import { LuDownload, LuUpload, LuCircleCheck, LuInfo } from "react-icons/lu";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { downloadUserDataExport } from "../../services/dataExportService";

const INCLUDED_ITEMS = [
  "Profile information",
  "Income & expenses",
  "Budgets",
  "Savings goals",
  "Achievements",
  "Notifications",
];

/**
 * "Export My Data" downloads a complete ZIP archive (Excel workbook +
 * per-category JSON files + README) built server-side by
 * users/data_export_service.py via services/dataExportService.js -
 * every record the user owns, not date-filtered like the Reports page
 * export. See dataExportService.js for why this is a separate
 * function from the Reports export functions rather than a reuse of
 * them.
 *
 * Import is intentionally NOT implemented: there is no bulk-create
 * backend endpoint to accept it, and building one wasn't part of the
 * agreed backend work for this phase. Showing a working button for it
 * would be dishonest, so it's disabled with an explanation instead.
 */
export default function DataManagementSection() {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadUserDataExport();
      showToast("Your data export has started downloading.", "success");
    } catch {
      showToast("Couldn't export your data. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div id="data-management" className="bg-surface rounded shadow-token-sm hover-card p-4">
      <h2 className="font-display fs-6 fw-semibold mb-1">Export Your Data</h2>
      <p className="text-muted-ink small mb-3">
        Download a complete copy of the personal and financial data associated with your BudgetBuddy account.
      </p>

      <div className="mb-3">
        <div className="text-muted-ink small fw-semibold mb-2">Includes:</div>
        <div className="row g-1">
          {INCLUDED_ITEMS.map((item) => (
            <div className="col-6 col-md-4" key={item}>
              <div className="d-flex align-items-center gap-2 small">
                <LuCircleCheck size={14} className="text-income flex-shrink-0" />
                <span>{item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="d-flex align-items-start gap-2 mb-3 text-muted-ink small">
        <LuInfo size={14} className="flex-shrink-0 mt-1" />
        <span>Does not include: passwords, authentication credentials, or private system data.</span>
      </div>

      <div className="d-flex flex-wrap gap-2">
        <Button variant="secondary" icon={LuDownload} loading={exporting} onClick={handleExport}>
          Download My Data
        </Button>
        <Button variant="ghost" icon={LuUpload} disabled title="Import isn't available yet">
          Import Data
        </Button>
      </div>

      <div className="d-flex align-items-start gap-2 mt-3 text-muted-ink small">
        <LuInfo size={14} className="flex-shrink-0 mt-1" />
        <span>Import isn't available yet — this will let you restore from a previous export in a future update.</span>
      </div>
    </div>
  );
}
