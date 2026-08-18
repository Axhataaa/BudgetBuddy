import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatCurrency, convertFromInr, getActiveCurrency, getCurrencyDecimals } from "./formatCurrency";
import { NOTO_SANS_REGULAR_BASE64 } from "../assets/fonts/notoSansPdfFont";
import { NOTO_SANS_BOLD_BASE64 } from "../assets/fonts/notoSansPdfFontBold";

const PDF_FONT_NAME = "NotoSansPdf";
const PDF_FONT_FILE = "NotoSans-Regular.ttf";
const PDF_FONT_FILE_BOLD = "NotoSans-Bold.ttf";

function registerPdfFont(doc) {
  doc.addFileToVFS(PDF_FONT_FILE, NOTO_SANS_REGULAR_BASE64);
  doc.addFont(PDF_FONT_FILE, PDF_FONT_NAME, "normal");
  doc.addFileToVFS(PDF_FONT_FILE_BOLD, NOTO_SANS_BOLD_BASE64);
  doc.addFont(PDF_FONT_FILE_BOLD, PDF_FONT_NAME, "bold");
  doc.setFont(PDF_FONT_NAME, "normal");
}

function formatCurrencyForPdf(amountInInr) {
  return formatCurrency(amountInInr);
}

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

function money(amountInInr) {
  // Round to the active display currency's normal decimal precision
  // (0 for JPY/KRW, 2 for everything else) instead of always rounding
  // to 2 decimals, so CSV/Excel numeric cells match what the UI and
  // PDF export show for the same currency.
  const decimals = getCurrencyDecimals();
  const factor = decimals === 0 ? 1 : 100;
  return Math.round(convertFromInr(amountInInr) * factor) / factor;
}

export function exportReportCsv(report, periodLabel) {
  const { summary, trend, expense_by_category, income_by_source, budget_performance, transactions } = report;
  const currency = getActiveCurrency();

  let csv = `BudgetBuddy Report - ${periodLabel}\n`;
  csv += `Generated,${new Date().toLocaleString("en-IN")}\n`;
  csv += `Currency,${currency}\n\n`;

  csv += csvSection("Summary", [
    { Metric: "Total Income", [`Value (${currency})`]: money(summary.total_income) },
    { Metric: "Total Expenses", [`Value (${currency})`]: money(summary.total_expenses) },
    { Metric: "Current Balance", [`Value (${currency})`]: money(summary.current_balance) },
    { Metric: "Savings Rate (%)", [`Value (${currency})`]: summary.savings_rate },
  ]);

  csv += csvSection(
    "Transactions",
    (transactions || []).map((t) => ({
      Date: t.date,
      Type: t.type,
      Category: t.category,
      Description: t.description,
      [`Amount (${currency})`]: money(t.amount),
    }))
  );

  csv += csvSection(
    "Income vs Expense Trend",
    trend.map((t) => ({
      Period: t.period,
      [`Income (${currency})`]: money(t.income),
      [`Expenses (${currency})`]: money(t.expenses),
    }))
  );

  csv += csvSection(
    "Expense by Category",
    expense_by_category.map((c) => ({ Category: c.category, [`Total (${currency})`]: money(c.total) }))
  );

  csv += csvSection(
    "Income by Source",
    income_by_source.map((s) => ({ Source: s.source, [`Total (${currency})`]: money(s.total) }))
  );

  csv += csvSection(
    "Budget Performance",
    budget_performance.map((b) => ({
      Category: b.category,
      [`Limit (${currency})`]: money(b.limit),
      [`Spent (${currency})`]: money(b.spent),
      "Percent Used": b.percent_used,
    }))
  );

  downloadBlob(`budgetbuddy-report-${report.date_from}-to-${report.date_to}.csv`, csv, "text/csv;charset=utf-8;");
}

export function exportReportExcel(report, periodLabel) {
  const { summary, trend, expense_by_category, income_by_source, budget_performance, transactions } = report;
  const currency = getActiveCurrency();

  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([
    { Metric: "Report Period", [`Value (${currency})`]: periodLabel },
    { Metric: "Generated", [`Value (${currency})`]: new Date().toLocaleString("en-IN") },
    { Metric: "Total Income", [`Value (${currency})`]: money(summary.total_income) },
    { Metric: "Total Expenses", [`Value (${currency})`]: money(summary.total_expenses) },
    { Metric: "Current Balance", [`Value (${currency})`]: money(summary.current_balance) },
    { Metric: "Savings Rate (%)", [`Value (${currency})`]: summary.savings_rate },
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  if (transactions && transactions.length) {
    const transactionsSheet = XLSX.utils.json_to_sheet(
      transactions.map((t) => ({
        Date: t.date,
        Type: t.type,
        Category: t.category,
        Description: t.description,
        [`Amount (${currency})`]: money(t.amount),
      }))
    );
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transactions");
  }

  if (trend.length) {
    const trendSheet = XLSX.utils.json_to_sheet(
      trend.map((t) => ({
        Period: t.period,
        [`Income (${currency})`]: money(t.income),
        [`Expenses (${currency})`]: money(t.expenses),
      }))
    );
    XLSX.utils.book_append_sheet(workbook, trendSheet, "Trend");
  }

  if (expense_by_category.length) {
    const categorySheet = XLSX.utils.json_to_sheet(
      expense_by_category.map((c) => ({ Category: c.category, [`Total (${currency})`]: money(c.total) }))
    );
    XLSX.utils.book_append_sheet(workbook, categorySheet, "Expense by Category");
  }

  if (income_by_source.length) {
    const sourceSheet = XLSX.utils.json_to_sheet(
      income_by_source.map((s) => ({ Source: s.source, [`Total (${currency})`]: money(s.total) }))
    );
    XLSX.utils.book_append_sheet(workbook, sourceSheet, "Income by Source");
  }

  if (budget_performance.length) {
    const budgetSheet = XLSX.utils.json_to_sheet(
      budget_performance.map((b) => ({
        Category: b.category,
        [`Limit (${currency})`]: money(b.limit),
        [`Spent (${currency})`]: money(b.spent),
        "Percent Used": b.percent_used,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, budgetSheet, "Budget Performance");
  }

  XLSX.writeFile(workbook, `budgetbuddy-report-${report.date_from}-to-${report.date_to}.xlsx`);
}

export function exportReportPdf(report, periodLabel) {
  const { summary, trend, expense_by_category, income_by_source, budget_performance, transactions } = report;
  const doc = new jsPDF();
  const currency = getActiveCurrency();
  registerPdfFont(doc);

  doc.setFontSize(18);
  doc.setTextColor(48, 59, 142);
  doc.setFont(undefined, "bold");
  doc.text("BUDGETBUDDY", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.setFont(PDF_FONT_NAME, "normal");
  doc.text("Personal Financial Report", 14, 25);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Reporting Period: ${periodLabel}`, 14, 33);
  doc.text(
    `Generated ${new Date().toLocaleString("en-IN")}  |  Currency: ${currency}`,
    14,
    39
  );

  autoTable(doc, {
    startY: 46,
    head: [["Metric", "Value"]],
    body: [
      ["Total Income", formatCurrencyForPdf(summary.total_income)],
      ["Total Expenses", formatCurrencyForPdf(summary.total_expenses)],
      ["Current Balance", formatCurrencyForPdf(summary.current_balance)],
      ["Savings Rate", `${Number(summary.savings_rate).toFixed(1)}%`],
    ],
    theme: "striped",
    headStyles: { fillColor: [48, 59, 142], font: PDF_FONT_NAME },
    styles: { font: PDF_FONT_NAME },
  });

  let nextY = doc.lastAutoTable.finalY + 10;

  const ensureSpace = (neededHeight) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (nextY + neededHeight > pageHeight - 20) {
      doc.addPage();
      nextY = 20;
    }
  };

  if (trend.length) {
    ensureSpace(20);
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Income vs Expense Trend", 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [["Period", "Income", "Expenses"]],
      body: trend.map((t) => [t.period, formatCurrencyForPdf(t.income), formatCurrencyForPdf(t.expenses)]),
      theme: "striped",
      headStyles: { fillColor: [48, 59, 142], font: PDF_FONT_NAME },
      styles: { font: PDF_FONT_NAME },
    });
    nextY = doc.lastAutoTable.finalY + 10;
  }

  if (expense_by_category.length) {
    ensureSpace(20);
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Expense Category Breakdown", 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [["Category", "Total"]],
      body: expense_by_category.map((c) => [c.category, formatCurrencyForPdf(c.total)]),
      theme: "striped",
      headStyles: { fillColor: [48, 59, 142], font: PDF_FONT_NAME },
      styles: { font: PDF_FONT_NAME },
    });
    nextY = doc.lastAutoTable.finalY + 10;
  }

  if (income_by_source.length) {
    ensureSpace(20);
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Income Source Analysis", 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [["Source", "Total"]],
      body: income_by_source.map((s) => [s.source, formatCurrencyForPdf(s.total)]),
      theme: "striped",
      headStyles: { fillColor: [48, 59, 142], font: PDF_FONT_NAME },
      styles: { font: PDF_FONT_NAME },
    });
    nextY = doc.lastAutoTable.finalY + 10;
  }

  if (budget_performance.length) {
    ensureSpace(20);
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Budget Performance", 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [["Category", "Limit", "Spent", "% Used"]],
      body: budget_performance.map((b) => [
        b.category,
        formatCurrencyForPdf(b.limit),
        formatCurrencyForPdf(b.spent),
        `${b.percent_used.toFixed(0)}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [48, 59, 142], font: PDF_FONT_NAME },
      styles: { font: PDF_FONT_NAME },
    });
    nextY = doc.lastAutoTable.finalY + 10;
  }

  if (transactions && transactions.length) {
    ensureSpace(20);
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Transactions", 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [["Date", "Type", "Category", "Description", "Amount"]],
      body: transactions.map((t) => [
        t.date,
        t.type,
        t.category,
        t.description,
        formatCurrencyForPdf(t.amount),
      ]),
      theme: "striped",
      headStyles: { fillColor: [48, 59, 142], font: PDF_FONT_NAME },
      styles: { fontSize: 8, font: PDF_FONT_NAME },
    });
  }

  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Generated by BudgetBuddy", 14, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, {
      align: "right",
    });
  }

  doc.save(`budgetbuddy-report-${report.date_from}-to-${report.date_to}.pdf`);
}
