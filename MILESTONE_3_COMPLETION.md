# ✅ Milestone 3 Completion Report

## Milestone Title

Savings Goals, Reports, Notifications & Landing Page

---

## Objective

| Task                                 | Status  | Notes                                                                                                                  |
| ------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| Savings Goals with progress tracking | ✅ Done | `SavingsGoal` + `SavingsTransaction` models; deposit/withdrawal history, completed goals become Achievements           |
| Reports (date-range, category-wise)  | ✅ Done | `reports.services.get_report_data()`, single endpoint driving both charts and exports                                  |
| CSV export                           | ✅ Done | Client-side (`utils/exportReport.js`); Summary, Trend, Expense by Category, Income by Source, Budget Performance       |
| Excel export                         | ✅ Done | Multi-sheet workbook (SheetJS), same sections as CSV                                                                   |
| PDF export                           | ✅ Done | jsPDF + autotable; Summary, Category, Source, Budget Performance, paginated footer (Trend section not included in PDF) |
| Notifications                        | ✅ Done | `Notification` model, 11 types (3 legacy + 8 current), priority levels, deduplication                                  |
| Charts & Analytics                   | ✅ Done | Trend chart, category/source pie charts, budget performance bars (Recharts)                                            |

---

# Savings Goals

- Target amount, deposits/withdrawals recorded as `SavingsTransaction` rows
- Completing a goal (`is_purchased=True`, `is_archived=True`) is what surfaces it under **Achievements** — there is no separate Achievement model or table
- Achievement deletion removes the underlying `SavingsGoal` row (and its transaction history cascades); Income/Expense records are untouched

---

# Reports

- Single backend endpoint: `GET /api/v1/reports/summary/?date_from=&date_to=`
- Supports Today / Week / Month / Year presets (resolved client-side, see [README.md § Reports & Analytics](README.md#-reports--analytics) for the exact rolling-window behavior) and a validated Custom Range
- Returns: financial summary, income-vs-expense trend (daily or monthly buckets depending on range length), expense-by-category, income-by-source, budget performance for the range, and derived insights (highest-spending category, largest expense, average daily spend, best saving period)
- Charts and the three export formats are built from the exact same API response, so they cannot drift out of sync with each other

---

# Data Export

All three formats are generated **client-side** from the Reports page's current data — there is no backend export endpoint.

- **CSV**: plain-text, sectioned (Summary / Trend / Expense by Category / Income by Source / Budget Performance)
- **Excel**: genuine multi-sheet `.xlsx` workbook (one sheet per section with data)
- **PDF**: BudgetBuddy-branded header, period + generation timestamp + currency, summary table, category/source/budget tables, "Page X of Y" footer

Exported amounts are converted to the user's active display currency, matching what's shown on screen.

---

# Notifications

- `Notification` model with `notification_type` (11 values: 3 legacy — `budget_alert` / `savings_goal` / `general` — kept for backward compatibility, plus 8 current values including `budget_warning`, `budget_exceeded`, `achievement`, `monthly_report`), `priority` (`low` / `medium` / `high`), `action_url`, `is_read`, and a deduplicating `dedup_key`
- `NotificationViewSet`: list/retrieve/delete, mark-read, mark-all-read, clear-all, server-side filtering
- Notifications fire from expense/income creation, budget threshold crossings (80/90/100%), and savings-goal lifecycle events, through two shared helpers: `sync_entity_notification()` for entity-linked, self-updating notifications (expense/income/budget/savings-goal created or edited) and `create_notification()` for one-off historical events (threshold alerts, reminders, monthly reports, achievements)
- Two management commands add periodic notifications: `generate_monthly_report_notifications` and `send_savings_reminders --days N` — both manually run (no Celery/scheduler wired in yet)
- **Email notifications are implemented** (Gmail SMTP) for a subset of high-signal events — budget warning/exceeded, savings goal completed, achievements, monthly report — gated behind email verification and per-category preferences. Email Verification itself is documented separately, as it was built alongside the Milestone 4 work; see [README.md § Email Notifications](README.md#-email-notifications) and [README.md § Email Verification](README.md#-email-verification)

---

# Landing Page, Contact Page & Theme

- Public Landing Page with a light/dark theme toggle in the navbar (reusing the same `PreferencesContext` the authenticated app uses)
- Contact page: developer info, contact cards (Email/GitHub/LinkedIn/Location), and a message form with a "What's this about?" reason field (General Question / Feedback / Feature Request / Bug Report / Collaboration / Other) — feedback was deliberately merged into this form rather than kept as a separate Feedback page/route
- Logout (and any unauthenticated access to a protected route) now redirects to `/` (the Landing Page) instead of `/login`, across both `ProtectedRoute` and `AdminProtectedRoute`

---

# Technologies Used

- Django REST Framework
- React, Recharts
- jsPDF, jspdf-autotable, SheetJS (xlsx)
- Bootstrap
- PostgreSQL

---

# Deliverables

A complete Savings Goals + Reports + Notifications feature set, plus a public-facing Landing/Contact experience and a corrected post-logout redirect — all verified against the live source code for this documentation pass.

---

## Status

✅ Completed
