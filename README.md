# 💰 BudgetBuddy

**BudgetBuddy** is a full-stack personal finance management application that helps users track income and expenses, manage category-wise budgets, work toward savings goals, review spending through reports and analytics, and stay informed via in-app notifications.

It is built with **Django REST Framework** (backend) and **React + Vite** (frontend), and was developed as part of the **Infosys Springboard 7.0 Internship Program**.

> This README reflects the project **as currently implemented in the source code**, not as originally planned. See [Known Limitations](#-known-limitations) for what is intentionally not yet built.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Application Modules](#-application-modules)
4. [Tech Stack](#-tech-stack)
5. [System Architecture](#-system-architecture)
6. [Project Structure](#-project-structure)
7. [Core Workflows](#-core-workflows)
8. [Notification System](#-notification-system)
9. [Email Verification](#-email-verification)
10. [Email Notifications](#-email-notifications)
11. [Reports & Analytics](#-reports--analytics)
12. [AI Financial Analysis](#-ai-financial-analysis)
13. [Data Export](#-data-export)
14. [Authentication & Security](#-authentication--security)
15. [Theme & Currency](#-theme--currency)
16. [Setup & Installation](#-setup--installation)
17. [Environment Variables](#-environment-variables)
18. [Testing & Verification](#-testing--verification)
19. [Known Limitations](#-known-limitations)
20. [Future Improvements](#-future-improvements)
21. [Screenshots](#-screenshots)
22. [Documentation Index](#-documentation-index)
23. [Developer](#-developer)
24. [License](#-license)

---

## 🧭 Project Overview

Managing personal finances across scattered spreadsheets, banking apps, and mental math makes it easy to lose track of where money actually goes. BudgetBuddy consolidates income, expenses, budgets, and savings goals into one place, and turns that data into readable reports rather than raw transaction lists.

**Who it's for:** individuals — students, freelancers, working professionals — who want a straightforward way to log transactions, set category budgets, and see whether they're on track, without needing a bank integration.

**What makes it more than a transaction log:**

- Budgets are tied to actual expense data, with automatic alerts at 80% / 90% / 100% usage.
- Savings goals track real deposit/withdrawal history, not just a target number, and completed goals become "Achievements."
- Reports compute income vs. expense trends, category breakdowns, and budget performance for any selected date range, and export that exact range to CSV, Excel, or PDF.
- An opt-in **AI Financial Analyst** (Google Gemini) turns a report's own numbers into a plain-language read — patterns, risks, recommendations — without inventing figures that aren't in the underlying data.
- A Django-backed Admin Dashboard gives a separate, role-gated monitoring view of platform-wide usage.

BudgetBuddy does not claim real bank connectivity or production-scale infrastructure — it is a complete, working CRUD + analytics application, built on a conventional Django REST Framework + React stack, with one opt-in AI feature layered on top of its own (non-AI) reporting data. See [AI Financial Analysis](#-ai-financial-analysis).

---

## ✨ Key Features

- **Authentication** — JWT-based register/login/refresh/logout with server-side token blacklisting
- **Email Verification** — registration and email-change verification via single-use, expiring, SHA-256-hashed tokens; resend with cooldown; distinct invalid/expired/already-used error states
- **Expense tracking** — 8 categories, 4 payment methods, search, filtering, sorting, pagination
- **Income tracking** — 6 sources, full CRUD, search, sorting, pagination
- **Budgets** — one budget per user/category/month/year, with utilization tracking and threshold alerts
- **Savings Goals** — deposits/withdrawals against a target amount, with full transaction history
- **Achievements** — completed savings goals surfaced as a dedicated "wins" view
- **Dashboard** — month/year-navigable summary: income, expenses, net savings, budget progress, category spending, recent activity
- **Reports** — date-range-driven summary, trend chart, category/source breakdowns, budget performance, and CSV/Excel/PDF export
- **AI Financial Analysis** — opt-in, Gemini-backed plain-language read on a report's own data (observations, patterns, risks, recommendations); degrades gracefully with no key configured
- **Notifications** — in-app notification center with a live sidebar unread-count badge, plus opt-in email delivery (Gmail SMTP) for budget alerts, savings-goal milestones, achievements, and monthly reports
- **Profile & Settings** — profile picture, personal details, password change, appearance (theme), currency, and data export
- **Admin Dashboard** — separate role-gated view with platform-wide usage statistics
- **Landing Page & Contact Page** — public marketing pages with an integrated contact/feedback form
- **Light/Dark theme** — applied instantly across the whole app via CSS custom properties
- **Multi-currency display** — INR is the storage currency; other currencies are a live display-time conversion

---

## 🧩 Application Modules

| Module                 | Status             | Notes                                                                                                                                                                                  |
| ---------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication         | ✅ Implemented     | JWT + blacklist, RBAC via `Profile.role`                                                                                                                                               |
| Email Verification     | ✅ Implemented     | Register + email-change, expiring single-use tokens. See [Email Verification](#-email-verification)                                                                                    |
| Dashboard              | ✅ Implemented     | Month/year navigation, live summary                                                                                                                                                    |
| Expenses               | ✅ Implemented     | Full CRUD, filters, pagination                                                                                                                                                         |
| Income                 | ✅ Implemented     | Full CRUD, filters, pagination                                                                                                                                                         |
| Budgets                | ✅ Implemented     | Threshold-based alerts (80/90/100%)                                                                                                                                                    |
| Savings Goals          | ✅ Implemented     | Deposit/withdrawal transactions                                                                                                                                                        |
| Achievements           | ✅ Implemented     | Derived from completed savings goals (no separate model)                                                                                                                               |
| Reports & Analytics    | ✅ Implemented     | Date-range driven, CSV/Excel/PDF export                                                                                                                                                |
| AI Financial Analysis  | ✅ Implemented     | Opt-in, Google Gemini-backed. See [AI Financial Analysis](#-ai-financial-analysis)                                                                                                     |
| Notifications (in-app) | ✅ Implemented     | 11 types, priority levels, deduplication                                                                                                                                               |
| Email Notifications    | ✅ Implemented     | Gmail SMTP, per-category opt-in. See [Email Notifications](#-email-notifications)                                                                                                      |
| Profile                | ✅ Implemented     | Picture upload, personal details, password change                                                                                                                                      |
| Settings               | ✅ Implemented     | Appearance, currency, data export                                                                                                                                                      |
| Data Import            | ❌ Not implemented | UI shows a disabled button with an explanation                                                                                                                                         |
| Admin Dashboard        | ✅ Implemented     | Platform-wide stats, role-gated                                                                                                                                                        |
| Landing Page           | ✅ Implemented     | Public marketing page                                                                                                                                                                  |
| Contact Page           | ✅ Implemented     | Includes merged feedback form (no separate Feedback page)                                                                                                                              |
| Theme (Light/Dark)     | ✅ Implemented     | `data-theme` attribute + CSS variables                                                                                                                                                 |
| Automated test suite   | ⚠️ Partial         | Real `TestCase` coverage in `expenses`, `notifications`, `ai_analysis`; empty stubs in `budgets`, `incomes`, `reports`, `users`. See [Testing & Verification](#-testing--verification) |

---

## 🛠 Tech Stack

### Backend

| Technology                                 | Version |
| ------------------------------------------ | ------- |
| Python                                     | 3.13    |
| Django                                     | 6.0.6   |
| Django REST Framework                      | 3.17.1  |
| djangorestframework-simplejwt              | 5.5.1   |
| django-cors-headers                        | 4.9.0   |
| django-filter                              | 25.1    |
| PostgreSQL (via psycopg / psycopg2-binary) | —       |
| Pillow                                     | 12.3.0  |
| python-decouple                            | 3.8     |

Exact versions: [`backend/requirements.txt`](backend/requirements.txt).

### External Services

| Service                                       | Used for                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Google Gemini (`gemini-3.6-flash` by default) | AI Financial Analysis — called directly via `urllib` (no SDK dependency), server-side only. See [AI Financial Analysis](#-ai-financial-analysis) |
| Gmail SMTP                                    | Email verification links and opt-in notification emails. See [Email Notifications](#-email-notifications)                                        |

### Frontend

| Technology              | Version         |
| ----------------------- | --------------- |
| React                   | ^19.2.7         |
| Vite                    | ^8.1.1          |
| React Router DOM        | ^7.18.1         |
| Axios                   | ^1.18.1         |
| Bootstrap               | ^5.3.8          |
| React Icons             | ^5.7.0          |
| Recharts                | ^3.9.2          |
| jsPDF + jspdf-autotable | ^4.2.1 / ^5.0.8 |
| xlsx (SheetJS)          | ^0.18.5         |
| oxlint (dev)            | ^1.71.0         |

Exact versions: [`frontend/package.json`](frontend/package.json).

### Development Tools

Git, GitHub, VS Code, Postman, pgAdmin 4.

---

## 🏗 System Architecture

```
User
 │
 ▼
React Frontend (Vite)
 │  Axios + JWT (access/refresh tokens in localStorage; 401 triggers one shared refresh call, retried once)
 ▼
REST API  (/api/v1/...)
 │
 ▼
Django Backend (DRF ViewSets / APIViews)
 │
 ▼
Services / Business Logic
   ├─ notifications.notification_service.create_notification() / sync_entity_notification()
   ├─ budgets.notifications (threshold checks)
   ├─ reports.services.get_report_data()
   └─ ai_analysis.services.build_financial_snapshot() → ai_analysis.gemini_client (external call)
 │
 ▼
PostgreSQL Database
```

**Notifications** (in-app center, plus opt-in email for a subset of events — see [Email Notifications](#-email-notifications)):

```
Event (expense/income/budget/savings action)
 │
 ▼
sync_entity_notification()  →  entity-linked Notification row, kept in sync via update_or_create() on dedup_key
   (create_notification() is used instead for historical/periodic events — budget threshold
   alerts, savings reminders, monthly reports, purchase-completed — that should not be overwritten)
 │
 ▼
GET /api/v1/notifications/  →  Notification Center (frontend)  +  sidebar unread-count badge (polled every 30s)
```

**Reports:**

```
User selects a period (Today / Week / Month / Year / Custom)
 │
 ▼
Frontend resolves {date_from, date_to}  (utils/dateRanges.js)
 │
 ▼
GET /api/v1/reports/summary/?date_from=&date_to=
 │
 ▼
reports.services.get_report_data()  →  aggregated JSON (summary, trend, breakdowns, insights)
 │
 ├─▶ Charts & summary cards render this payload directly
 └─▶ CSV / Excel / PDF export (client-side) reads the SAME payload
```

Because both the on-screen report and the three export formats are built from one API response, they are inherently kept in sync — there is no separate export-side date calculation.

**AI Financial Analysis:**

```
User clicks "Analyze My Finances" on the Reports page (for the currently selected date range)
 │
 ▼
POST /api/v1/ai-analysis/analyze/  {date_from, date_to, refresh}
 │
 ▼
ai_analysis.services.build_financial_snapshot()  →  reuses reports.services.get_report_data()
   for that same user + range, converts amounts to the user's display currency
 │
 ├─▶ No activity in range           →  {"status": "insufficient_data"} — Gemini is never called
 ├─▶ 180s per-user/per-range cache hit (and refresh=false) → cached payload returned, {"cached": true}
 └─▶ Otherwise: ai_analysis.gemini_client.generate_financial_analysis(snapshot) calls Gemini
        │
        ├─▶ Success → structured JSON (overall/observations/patterns/risks/recommendations/
        │             savings_strategy/positive_progress), validated and cached
        └─▶ Missing key / network / malformed response → AIAnalysisUnavailable, caught by the
              view → {"status": "unavailable"} — the rest of the app is unaffected
```

---

## 📂 Project Structure

```text
BudgetBuddy/
│
├── backend/
│   ├── config/            # Django project settings, root urls.py
│   ├── users/              # Auth, Profile (role/theme/currency prefs)
│   ├── expenses/           # Expense CRUD + filtering
│   ├── incomes/            # Income CRUD + filtering
│   ├── budgets/             # Budget, SavingsGoal, SavingsTransaction + alert logic
│   ├── analytics/           # Dashboard summary, recent activity, admin stats
│   ├── reports/             # Date-range report aggregation (reports/services.py)
│   ├── ai_analysis/          # AI Financial Analyst — Gemini client, snapshot builder, single endpoint
│   ├── notifications/       # Notification model, service, management commands
│   ├── common/               # Shared formatting helpers (e.g. INR formatting)
│   ├── dashboard/            # Registered app scaffold; currently unused (no models/views)
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios instance + interceptors
│   │   ├── app/                # ProtectedRoute, AdminProtectedRoute, AppShell
│   │   ├── components/         # Reusable UI (ui/, dashboard/, reports/, settings/, admin/, layout/)
│   │   ├── context/             # AuthContext, PreferencesContext, NotificationsContext
│   │   ├── hooks/                # useAuth, usePreferences, useNotifications
│   │   ├── pages/                 # Home (landing/login/register/contact), Dashboard, Expenses,
│   │   │                           # Income, Budgets, SavingsGoals, Achievements, Reports,
│   │   │                           # Notifications, Profile, Settings, Admin
│   │   ├── services/               # One file per API resource (expenseService.js, etc.)
│   │   ├── utils/                   # dateRanges.js, exportReport.js, formatCurrency.js, ...
│   │   ├── App.jsx
│   │   └── index.css                # Design tokens (CSS variables) + global styles
│   ├── package.json
│   └── vite.config.js
│
├── Screenshots/            # Early Milestone 1 setup/testing screenshots (see Screenshots section)
├── .env.example
├── README.md
├── PROJECT_OVERVIEW.md
├── INSTALLATION.md
├── DEVELOPMENT_LOG.md
└── MILESTONE_1..4_COMPLETION.md
```

---

## 🔄 Core Workflows

**Registration → Login:** a new user registers, a `Profile` is auto-created via a Django signal (one-to-one with `User`, default role `student`), then logs in through the JWT endpoint.

**Logging a transaction:** creating an Expense or Income immediately (a) reflects in Dashboard/Reports on next fetch, and (b) fires a low-priority "Added" notification via `sync_entity_notification()`. Editing that same Expense/Income later re-syncs the identical notification (same `dedup_key`) rather than creating a new one, so the Notification Center never accumulates duplicate entries for one transaction.

**Budgets:** creating a Budget for a category/month/year, then adding Expenses in that category, triggers `check_and_notify_budget_alerts()` after each expense — it recalculates spend for that exact category/month/year and fires a deduplicated notification once each threshold (80% / 90% / 100%) is first crossed.

**Savings Goals:** a goal is created with a target amount; deposits/withdrawals are logged as `SavingsTransaction` rows against it. Completing a goal (`is_purchased=True`, `is_archived=True`) is what makes it appear under Achievements — there is no separate Achievement model.

**Reports:** selecting a period (Today/Week/Month/Year/Custom Range) resolves to `{date_from, date_to}` on the frontend, which is sent to `/api/v1/reports/summary/`. The single JSON response drives the summary cards, trend chart, category/source breakdowns, budget performance, and the three export formats.

---

## 🔔 Notification System

Implemented as the `notifications` Django app (`Notification` model + `NotificationViewSet`).

**Notification types** (`Notification.NotificationType`, exact backend values). The model defines 11 values in total: the original 3 (`budget_alert`, `savings_goal`, `general`) are kept only for backward compatibility with existing rows and are no longer produced by new events; all new notifications use the 8 more granular types below.

| Value                     | Used for                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `expense`                 | Expense Added                                                                                 |
| `income`                  | Income Added                                                                                  |
| `budget`                  | Budget created/updated (lifecycle, distinct from threshold alerts)                            |
| `budget_warning`          | Budget crossing the 80%/90% threshold                                                         |
| `budget_exceeded`         | Budget crossing 100%                                                                          |
| `savings_goal`            | Goal Created, Deposit Added, Withdrawal Made, Goal Completed                                  |
| `achievement`             | A savings goal marked "Purchase Completed" (graduates to Achievements)                        |
| `monthly_report`          | Monthly Report Ready (periodic command)                                                       |
| `reminder`                | Savings Reminder for an idle goal (periodic command)                                          |
| `admin`                   | Reserved for future admin/system-originated notifications — not yet produced by any call site |
| `budget_alert`, `general` | Legacy values, retained only so pre-existing rows still validate                              |

**Priority levels** (`Notification.Priority`): `low`, `medium`, `high`. Budget Exceeded and the 90% Budget Warning tier are `high`; the 80% Budget Warning tier is `medium`; routine "Added" events default to `low`.

**Other implemented behavior:**

- `title`, `message`, `action_url` (deep-links the notification to the relevant page, e.g. `/budgets`, `/savings-goals`)
- `is_read` with mark-read / mark-all-read / clear-all actions (`NotificationViewSet`)
- **Deduplication** via a `dedup_key` field with a DB-level unique constraint (`unique_user_dedup_key`) — e.g. a given budget only ever fires one notification per threshold tier, no matter how many further expenses are logged
- **Entity-linked, self-syncing notifications**: `Notification` has nullable FKs to `expense`, `income`, `budget`, and `savings_goal`. Creating or editing one of those records calls `sync_entity_notification()`, which uses `update_or_create()` on `(user, dedup_key)` — so the Added/Created notification for that record is kept up to date in place instead of a fresh duplicate being inserted on every edit. `create_notification()` (plain `get_or_create()`) is still used unchanged for one-off/historical events that shouldn't be overwritten: budget threshold alerts, savings reminders, monthly reports, and purchase-completed/achievement notifications.
- Server-side filtering by `notification_type` / `is_read` (`NotificationFilter`)
- **Unread-count badge**: the sidebar (`NotificationsContext` / `useNotifications`) shows an exact unread count up to 19, then "19+", and is hidden entirely at 0. It refreshes on mount, after any read/delete action taken on the Notifications page, and via a 30-second poll — there is no websocket push.

**Two management commands generate periodic notifications** (run manually or via an external scheduler — see [Known Limitations](#-known-limitations)):

- `python manage.py generate_monthly_report_notifications` — one "Monthly Report Ready" notification per non-admin user, deduplicated per month
- `python manage.py send_savings_reminders [--days N]` — a reminder for active savings goals with no deposit in `N` days (default 7), deduplicated per goal per calendar week

---

## ✉️ Email Verification

Registration and any change to `Profile`'s email address (`RegisterSerializer`, `ProfileSerializer.update()`) issue a single-use, SHA-256-hashed token (`EmailVerificationToken`) and email a verification link via `users/email_verification_service.py`. Only the hash is ever persisted; the raw token exists only long enough to build the link.

- **Link:** `POST /api/v1/users/verify-email/` with `{"token": "<raw token>"}`, `AllowAny` — the token itself, not an active session, proves the request.
- **Expiry:** 24 hours (`TOKEN_TTL_HOURS`).
- **Resend:** `POST /api/v1/users/resend-verification/`, `IsAuthenticated`, always targets `request.user.email`, 60-second cooldown (`RESEND_COOLDOWN_SECONDS`).
- **Distinct error states**, each mapped to its own user-facing message: invalid token, already-used token, expired token.
- **Email change re-verification:** changing `email` flips `Profile.email_verified` back to `False` and issues a fresh token for the new address; any previously unused token for that user is deleted first, and an old link stops matching once the address it was issued for no longer equals the account's current email.
- **Gates notification email:** `email_verified` must be `True` before any notification email is sent — see [Email Notifications](#-email-notifications).
- Manually verified end-to-end with a real Gmail-delivered verification email.

## 📧 Email Notifications

**Implemented**, via Gmail SMTP (`config/settings.py` reads `EMAIL_*` from `.env` with `EmailMultiAlternatives`, HTML + plain-text parts, and a set of Django templates under `notifications/templates/notifications/emails/`).

Not every in-app notification sends an email — `notifications/email_service.py` uses an explicit allow-list keyed on `(notification_type, priority)`:

| Event                                 | Type / priority                 | Template                      |
| ------------------------------------- | ------------------------------- | ----------------------------- |
| Budget nearing limit (90%)            | `budget_warning` @ `high`       | `budget_warning.html`         |
| Budget exceeded                       | `budget_exceeded` @ `high`      | `budget_exceeded.html`        |
| Savings goal completed                | `savings_goal` @ `medium`       | `savings_goal_completed.html` |
| Achievement (purchase completed)      | `achievement` (any priority)    | `achievement.html`            |
| Monthly report ready                  | `monthly_report` (any priority) | `monthly_report.html`         |
| Admin/system (reserved, unused today) | `admin` (any priority)          | `admin.html`                  |

Everything else (routine Expense/Income Added, budget's 80% warning tier, savings deposit/withdrawal, reminders, etc.) stays in-app only, by construction.

Before anything is sent, three independent gates all have to pass:

1. `Profile.email_notifications` — the master switch — must be `True`.
2. The event's own category preference (e.g. `Profile.email_savings_goal_notifications`, `Profile.budget_alert_notifications`) must be `True`. `email_achievement_notifications` defaults to `False`, so achievement emails are opt-in only.
3. `Profile.email_verified` must be `True` — an unverified email address is a hard gate that overrides every preference toggle above it.

A failed send is logged and swallowed (`dispatch_notification_email` never raises), so a broken email delivery never blocks or corrupts the underlying in-app notification.

---

## 📊 Reports & Analytics

Backend: `reports.services.get_report_data(user, date_from, date_to)`, exposed via `GET /api/v1/reports/summary/?date_from=&date_to=`.

**Period presets** (`frontend/src/utils/dateRanges.js`) — important to note these are **rolling/partial-to-date windows**, not always full calendar periods:

| Preset       | Resolved range                                                   |
| ------------ | ---------------------------------------------------------------- |
| Today        | today → today                                                    |
| Week         | today − 6 days → today (rolling 7-day window, **not** Mon–Sun)   |
| Month        | 1st of current month → **today** (not the last day of the month) |
| Year         | Jan 1 of current year → **today** (not Dec 31)                   |
| Custom Range | user-selected `date_from` / `date_to`, validated `from ≤ to`     |

**What the summary payload contains** (all scoped to the resolved range):

- `summary`: total income, total expenses, net savings, current balance, savings rate (%)
- `trend`: income vs. expenses bucketed by day (ranges ≤ 45 days) or by month (longer ranges)
- `expense_by_category`, `income_by_source`
- `budget_performance`: every budget whose month falls in the range, spend vs. limit for that range
- `insights`: highest-spending category, largest single expense, average daily spending, best saving period — all derived from the same data, never separately calculated

The Reports page (`Reports.jsx`) renders all of the above from one `report` state object — the same object the export functions read from, so charts and exports are guaranteed to represent the same date range.

---

## 🤖 AI Financial Analysis

An opt-in, on-demand feature on the Reports page (`AIFinancialAnalysis.jsx`) — not a background job, not always-on. The user clicks "Analyze My Finances" for the currently selected report range; nothing is generated automatically.

- **Endpoint**: `POST /api/v1/ai-analysis/analyze/` (`AIFinancialAnalysisView`), `IsAuthenticated`, always scoped to `request.user`.
- **Snapshot, not a raw dump**: `ai_analysis.services.build_financial_snapshot()` builds a compact JSON snapshot by reusing `reports.services.get_report_data()` for the same user/range and converting every amount to the user's active display currency — the AI never sees a different number than the user does. Savings goals are capped at 12 per section to bound payload size.
- **No activity, no call**: if there's no income/expense activity in the range, the view returns `{"status": "insufficient_data"}` and never calls Gemini.
- **Model call**: `ai_analysis.gemini_client.generate_financial_analysis()` calls the Google Gemini API (`GEMINI_MODEL`, default `gemini-3.6-flash`) directly over `urllib` — no Google SDK dependency — with a structured JSON response schema (`overall`, `key_observations`, `patterns`, `risks`, `recommendations`, `savings_strategy`, `positive_progress`) and a system prompt that restricts the model to the numbers already in the snapshot.
- **Graceful degradation**: a missing `GEMINI_API_KEY`, a network/HTTP error, or a malformed model response all raise `AIAnalysisUnavailable`, which the view turns into `{"status": "unavailable"}` — the rest of BudgetBuddy (including the underlying report data) is unaffected either way.
- **Caching**: successful results are cached server-side for 180 seconds per `(user, date_from, date_to, currency)`, so re-renders or accidental double-clicks don't spend an extra Gemini call; the frontend's "Refresh Analysis" button passes `refresh=true` to bypass this.
- **Frontend behavior**: changing the report's date range doesn't silently re-run the analysis (to avoid firing Gemini on every tweak) — an existing result is instead flagged as stale until the user explicitly refreshes.
- Backed by `ai_analysis/tests.py` (`AIFinancialAnalysisEndpointTests`).

---

## 📤 Data Export

BudgetBuddy has **two distinct export features** — do not conflate them:

### 1. Reports export (CSV / Excel / PDF)

Generated **client-side** (`frontend/src/utils/exportReport.js`, using jsPDF + jspdf-autotable + SheetJS/xlsx) from the exact `report` payload currently on screen — no separate backend export endpoint exists.

| Format | Sections included                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| CSV    | Summary, Income vs Expense Trend, Expense by Category, Income by Source, Budget Performance                     |
| Excel  | One sheet per section above (only sheets with data are created); no Trend/Insights omission — Trend is included |
| PDF    | Summary table, Expense by Category, Income by Source, Budget Performance, page-numbered footer                  |

Notes:

- **PDF does not include the Trend table** that CSV/Excel do.
- **None of the three formats include "Financial Insights"**, even though it's shown on the Reports page.
- **None include per-transaction (line-item) rows** — all three are aggregate reports, not transaction ledgers.
- Amounts are converted to the user's active display currency before export (same conversion used on-screen).
- Filenames embed the resolved date range, e.g. `budgetbuddy-report-2026-08-01-to-2026-08-06.pdf`.

### 2. "Export My Data" (Settings → Data Management)

A full personal-data backup, unrelated to the Reports page and with no date filtering — it always exports everything. `GET /api/v1/users/me/export-data/` (`ExportDataView`, backed by `users/data_export_service.py`) streams a ZIP containing:

- `BudgetBuddy_Data.xlsx` — one sheet per category
- `JSON/` — `profile.json`, `income.json`, `expenses.json`, `budgets.json`, `savings_goals.json`, `achievements.json`, `savings_transactions.json`, `notifications.json`
- `README.txt` describing the contents

Every queryset is scoped to `user=request.user`, and every serializer used is the same one already used elsewhere in the API for that user's own data, so the export can never include another user's rows, password hashes, or JWT tokens.

- "Import Data" is visibly present but **disabled**, with an explanatory tooltip — there is no backend endpoint to accept it.

---

## 🔐 Authentication & Security

- **JWT** via `djangorestframework-simplejwt`, with `rest_framework_simplejwt.token_blacklist` installed — logout blacklists the refresh token server-side (`LogoutView` → `LogoutSerializer`), it isn't just a client-side token drop.
- **Roles** (`Profile.Role`): `student`, `working_professional`, `freelancer`, `business_owner`, `other`, `admin`. Only `admin` affects route access; the others are informational/occupation fields.
- **Frontend route protection:**
  - `ProtectedRoute` wraps the authenticated app shell — unauthenticated visitors are redirected to `/` (the public Landing Page), **not** `/login`.
  - `AdminProtectedRoute` wraps `/admin` — unauthenticated visitors go to `/`; authenticated non-admins go to `/dashboard` (not `/login`, since they're already authenticated, just not authorized for that route).
- **Logout behavior:** clicking Log Out (Settings, or the Admin Dashboard's own logout action) always lands on the public Landing Page (`/`), not the login form. `AuthContext.logout()` itself only clears the token; the redirect is a consequence of `ProtectedRoute`/`AdminProtectedRoute` re-evaluating on the next render.
- **Protected API endpoints** use DRF's `IsAuthenticated`; ownership is enforced per-view (e.g. `Expense.objects.filter(user=request.user)`).

---

## 🎨 Theme & Currency

- **Theme:** Light / Dark / System, stored in `localStorage` (`budgetbuddy-theme`) and reconciled with the backend `Profile.theme` field once authenticated. Applied via a `data-theme` attribute on `<html>`; every surface in the app reads color through CSS custom properties (`index.css`), so no component needs theme-aware logic of its own.
- **Currency:** all financial data is stored and transmitted in **INR** — there is no currency field on any financial model. Selecting a different display currency (`Profile.Currency`: INR/USD/EUR/GBP) applies a live, session-cached exchange-rate conversion at display time only (`formatCurrency()`), including in Reports exports.

---

## ⚙️ Setup & Installation

Full step-by-step instructions: **[INSTALLATION.md](INSTALLATION.md)**.

Quick reference:

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

```bash
# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

| Service      | URL                          |
| ------------ | ---------------------------- |
| Backend API  | http://127.0.0.1:8000/       |
| Django Admin | http://127.0.0.1:8000/admin/ |
| Frontend     | http://localhost:5173/       |

---

## 🔧 Environment Variables

Backend configuration is read via `python-decouple` from a `.env` file in `backend/`. Copy `.env.example` and fill in real values — **never commit real credentials.**

| Variable              | Required | Purpose                                         | Example                                       |
| --------------------- | -------- | ----------------------------------------------- | --------------------------------------------- |
| `SECRET_KEY`          | Yes      | Django cryptographic signing key                | `your-secret-key`                             |
| `DEBUG`               | Yes      | Enables Django debug mode (`True`/`False`)      | `True`                                        |
| `ALLOWED_HOSTS`       | Yes      | Comma-separated list of allowed hostnames       | `127.0.0.1,localhost`                         |
| `DB_NAME`             | Yes      | PostgreSQL database name                        | `budgetbuddy`                                 |
| `DB_USER`             | Yes      | PostgreSQL username                             | `postgres`                                    |
| `DB_PASSWORD`         | Yes      | PostgreSQL password                             | `your_postgres_password`                      |
| `DB_HOST`             | Yes      | PostgreSQL host                                 | `localhost`                                   |
| `DB_PORT`             | Yes      | PostgreSQL port                                 | `5432`                                        |
| `EMAIL_BACKEND`       | No       | Django email backend class                      | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST`          | No       | SMTP host                                       | `smtp.gmail.com`                              |
| `EMAIL_PORT`          | No       | SMTP port                                       | `587`                                         |
| `EMAIL_USE_TLS`       | No       | Use TLS for SMTP                                | `True`                                        |
| `EMAIL_HOST_USER`     | No       | SMTP account username                           | `you@gmail.com`                               |
| `EMAIL_HOST_PASSWORD` | No       | SMTP account password / app password            | `your-app-password`                           |
| `DEFAULT_FROM_EMAIL`  | No       | "From" address on outgoing email                | `BudgetBuddy <you@gmail.com>`                 |
| `FRONTEND_URL`        | No       | Base URL used to build absolute links in emails | `http://localhost:5173`                       |
| `GEMINI_API_KEY`      | No       | Google Gemini API key for AI Financial Analysis | `your-gemini-api-key`                         |
| `GEMINI_MODEL`        | No       | Gemini model name                               | `gemini-3.6-flash` (default)                  |

All `EMAIL_*`/`FRONTEND_URL` variables fall back to safe defaults (`console.EmailBackend` and `http://localhost:5173`) if omitted, so the project still runs without them — but no real email will be delivered until valid SMTP credentials are supplied. See [Email Notifications](#-email-notifications).

`GEMINI_API_KEY` defaults to an empty string if omitted — the project still runs, but the AI Financial Analysis feature returns `{"status": "unavailable"}` for every request instead of erroring. See [AI Financial Analysis](#-ai-financial-analysis).

---

## ✅ Testing & Verification

**Automated tests:** every Django app has a `tests.py`, but coverage is uneven. `expenses`, `notifications`, and `ai_analysis` have real `TestCase`/`APIClient`-based test suites (same-date ordering tiebreaks, entity-notification sync/dedup behavior, and the AI analysis endpoint's insufficient-data/unavailable/success paths, respectively); `budgets`, `incomes`, `reports`, and `users` still have empty framework stubs with no real test cases. There is no frontend test suite, and no CI pipeline runs any of this automatically.

```bash
# Run the existing backend tests
cd backend
python manage.py test expenses notifications ai_analysis
```

**Manual verification performed on this codebase:**

```bash
# Backend
python manage.py check
python manage.py makemigrations --check --dry-run

# Frontend
npm run build      # Vite production build
npx oxlint          # Linting
```

These confirm the project has no system-check errors, no un-generated model migrations, and that the frontend builds cleanly for production. They are **not** a substitute for full test coverage, and do not verify runtime behavior against a live database.

---

## ⚠️ Known Limitations

- **Automated test coverage is partial** — real tests exist for `expenses`, `notifications`, and `ai_analysis`; `budgets`, `incomes`, `reports`, and `users` still have empty `tests.py` stubs, and there is no frontend test suite or CI pipeline.
- **AI Financial Analysis depends on an external, paid API** — with no `GEMINI_API_KEY` configured (or on a Gemini outage), the feature returns a plain "temporarily unavailable" message rather than an error; every other part of the app is unaffected.
- **Notifications are not scheduled automatically** — the monthly-report and savings-reminder commands must be run manually (or wired to an external scheduler like cron/Task Scheduler); there is no Celery/APScheduler integration.
- **No data import** — "Export My Data" works; the corresponding import is UI-disabled with no backend support.
- **Reports exports are aggregate-only** — no per-transaction line items in CSV/Excel/PDF, and the PDF omits the Trend section that CSV/Excel include.
- **"Week"/"Month"/"Year" report presets are rolling/to-date windows**, not always full calendar periods (see [Reports & Analytics](#-reports--analytics)).
- **No production deployment** — the project currently runs via Django's dev server and Vite's dev server only; no deployment configuration (WSGI/ASGI server, static file hosting, HTTPS) is included.
- **CORS is configured for local development only** — `CORS_ALLOWED_ORIGINS` in `config/settings.py` hardcodes `http://localhost:5173`; there is no production-origin or environment-driven CORS configuration yet.
- **Screenshots are outdated** — see [Screenshots](#-screenshots).
- **The `dashboard` backend app is an empty scaffold** — registered but contains no models, views, or URLs; all dashboard logic actually lives in the `analytics` app.
- **`reports.models.Report` is an unused model** — defined and admin-registered, but no view or service ever creates an instance of it. The Reports feature is computed live on every request by `reports.services.get_report_data()` and nothing is persisted to this table.

---

## 🚀 Future Improvements

_(Explicitly planned, not implemented.)_

- Celery or APScheduler for automatic monthly-report/savings-reminder scheduling instead of manual command runs
- Data import to complement the existing data export
- Automated backend test coverage for `budgets`, `incomes`, `reports`, and `users`, plus a frontend test suite
- Production deployment configuration
- Transaction-level line items in report exports

---

## 📷 Screenshots

The `Screenshots/` directory contains images from early **Milestone 1** setup and API testing (Django welcome page, Postman requests for the auth endpoints, the initial React + Vite scaffold, `makemigrations`/`migrate` output). **They do not reflect the current UI** — no Dashboard, Reports, Landing Page, or other current-feature screenshots exist in this repository at this time.

<!-- Screenshot: Dashboard (light theme) -->
<!-- Screenshot: Reports page with export controls -->
<!-- Screenshot: Landing Page -->

---

## 📚 Documentation Index

| Document                                               | Purpose                                             |
| ------------------------------------------------------ | --------------------------------------------------- |
| [README.md](README.md)                                 | This file — main project reference                  |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)             | Objectives, target users, high-level architecture   |
| [INSTALLATION.md](INSTALLATION.md)                     | Full local setup guide                              |
| [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)               | Milestone-by-milestone progress timeline            |
| [MILESTONE_1_COMPLETION.md](MILESTONE_1_COMPLETION.md) | Setup & authentication foundation                   |
| [MILESTONE_2_COMPLETION.md](MILESTONE_2_COMPLETION.md) | Core finance management modules                     |
| [MILESTONE_3_COMPLETION.md](MILESTONE_3_COMPLETION.md) | Savings Goals, Reports, Notifications, Landing Page |
| [MILESTONE_4_COMPLETION.md](MILESTONE_4_COMPLETION.md) | Deployment, testing & final documentation           |

---

## 👩‍💻 Developer

**Akshata Lokhande**
B.Tech – Information Technology
Madhav Institute of Technology & Science (MITS), Gwalior
Developed as part of the **Infosys Springboard 7.0 Internship Program**

---

## 📄 License

This project is intended for educational and internship purposes.
