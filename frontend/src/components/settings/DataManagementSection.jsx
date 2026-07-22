import { useState } from "react";
import { LuDownload, LuUpload, LuInfo } from "react-icons/lu";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import api from "../../api/axios";
import { listExpenses } from "../../services/expenseService";
import { listIncomes } from "../../services/incomeService";
import { listBudgets } from "../../services/budgetService";
import { listSavingsGoals } from "../../services/savingsGoalService";

// Follows DRF's `next` pagination link until exhausted. `next` is
// already an absolute URL, so it's passed straight to axios rather
// than through a service function (which only knows relative paths).
async function fetchAllPages(listFn) {
  let page = await listFn();
  let results = [...(page.results || [])];
  while (page.next) {
    // eslint-disable-next-line no-await-in-loop
    const response = await api.get(page.next);
    page = response.data;
    results = results.concat(page.results || []);
  }
  return results;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * "Export My Data" pulls every record you actually have (expenses,
 * income, budgets, savings goals) through the same list endpoints
 * used everywhere else in the app, paginating through all pages so
 * the export is complete, not just page 1. Bundled as one JSON file -
 * a personal data backup, distinct from the Reports page's PDF/CSV
 * export, which is a formatted report for a chosen date range.
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
      const [expenses, incomes, budgets, savingsGoals] = await Promise.all([
        fetchAllPages(listExpenses),
        fetchAllPages(listIncomes),
        fetchAllPages(listBudgets),
        fetchAllPages(listSavingsGoals),
      ]);

      downloadJson(`budgetbuddy-export-${new Date().toISOString().slice(0, 10)}.json`, {
        exported_at: new Date().toISOString(),
        expenses,
        incomes,
        budgets,
        savings_goals: savingsGoals,
      });

      showToast("Your data has been exported.", "success");
    } catch {
      showToast("Couldn't export your data. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div id="data-management" className="bg-surface rounded shadow-token-sm hover-card p-4">
      <h2 className="font-display fs-6 fw-semibold mb-1">Data Management</h2>
      <p className="text-muted-ink small mb-3">
        Export a full backup of your expenses, income, budgets and savings goals.
      </p>

      <div className="d-flex flex-wrap gap-2">
        <Button variant="secondary" icon={LuDownload} loading={exporting} onClick={handleExport}>
          Export My Data
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
