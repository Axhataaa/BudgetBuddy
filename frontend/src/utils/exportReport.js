import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./formatCurrency";

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function csvSection(title, rows) {
  if (!rows.length) return "";
  const header = Object.keys(rows[0]);
  const lines = [title, header.join(","), ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(","))];
  return lines.join("\n") + "\n\n";
}

/**
 * Exports the exact data currently shown on the Reports page - same
 * payload from getReportSummary(), no separate aggregation logic and
 * no backend involvement (client-side export, per the agreed plan).
 */
export function exportReportCsv(report, periodLabel) {
  const { summary, trend, expense_by_category, income_by_source, budget_performance } = report;

  let csv = `BudgetBuddy Report - ${periodLabel}\n`;
  csv += `Generated,${new Date().toLocaleString("en-IN")}\n\n`;

  csv += csvSection("Summary", [
    { Metric: "Total Income", Value: summary.total_income },
    { Metric: "Total Expenses", Value: summary.total_expenses },
    { Metric: "Net Savings", Value: summary.net_savings },
    { Metric: "Current Balance", Value: summary.current_balance },
    { Metric: "Savings Rate (%)", Value: summary.savings_rate },
  ]);

  csv += csvSection(
    "Income vs Expense Trend",
    trend.map((t) => ({ Period: t.period, Income: t.income, Expenses: t.expenses }))
  );

  csv += csvSection(
    "Expense by Category",
    expense_by_category.map((c) => ({ Category: c.category, Total: c.total }))
  );

  csv += csvSection(
    "Income by Source",
    income_by_source.map((s) => ({ Source: s.source, Total: s.total }))
  );

  csv += csvSection(
    "Budget Performance",
    budget_performance.map((b) => ({
      Category: b.category,
      Limit: b.limit,
      Spent: b.spent,
      "Percent Used": b.percent_used,
    }))
  );

  downloadBlob(`budgetbuddy-report-${report.date_from}-to-${report.date_to}.csv`, csv, "text/csv;charset=utf-8;");
}

export function exportReportPdf(report, periodLabel) {
  const { summary, expense_by_category, income_by_source, budget_performance } = report;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("BudgetBuddy Report", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${periodLabel}  |  Generated ${new Date().toLocaleString("en-IN")}`, 14, 25);

  autoTable(doc, {
    startY: 32,
    head: [["Metric", "Value"]],
    body: [
      ["Total Income", formatCurrency(summary.total_income)],
      ["Total Expenses", formatCurrency(summary.total_expenses)],
      ["Net Savings", formatCurrency(summary.net_savings)],
      ["Current Balance", formatCurrency(summary.current_balance)],
      ["Savings Rate", `${Number(summary.savings_rate).toFixed(1)}%`],
    ],
    theme: "striped",
    headStyles: { fillColor: [48, 59, 142] },
  });

  let nextY = doc.lastAutoTable.finalY + 10;

  if (expense_by_category.length) {
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Expense by Category", 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [["Category", "Total"]],
      body: expense_by_category.map((c) => [c.category, formatCurrency(c.total)]),
      theme: "striped",
      headStyles: { fillColor: [48, 59, 142] },
    });
    nextY = doc.lastAutoTable.finalY + 10;
  }

  if (income_by_source.length) {
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Income by Source", 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [["Source", "Total"]],
      body: income_by_source.map((s) => [s.source, formatCurrency(s.total)]),
      theme: "striped",
      headStyles: { fillColor: [48, 59, 142] },
    });
    nextY = doc.lastAutoTable.finalY + 10;
  }

  if (budget_performance.length) {
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Budget Performance", 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [["Category", "Limit", "Spent", "% Used"]],
      body: budget_performance.map((b) => [
        b.category,
        formatCurrency(b.limit),
        formatCurrency(b.spent),
        `${b.percent_used.toFixed(0)}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [48, 59, 142] },
    });
  }

  doc.save(`budgetbuddy-report-${report.date_from}-to-${report.date_to}.pdf`);
}
