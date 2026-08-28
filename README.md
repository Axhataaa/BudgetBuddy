# 💰 BudgetBuddy

**BudgetBuddy** is a full-stack personal finance management application that helps users track income and expenses, manage category-wise budgets, work toward savings goals, review spending through reports and analytics, and stay informed via in-app notifications.

It is built with **Django REST Framework** (backend) and **React + Vite** (frontend), and was developed as part of the **Infosys Springboard 7.0 Internship Program**.

> This README reflects the project **as currently implemented in the source code**, not as originally planned. See [Known Limitations](#-known-limitations) for what is intentionally not yet built.

**Live Application:** https://budget-buddy-ivory-mu.vercel.app

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

BudgetBuddy does not claim real bank connectivity or production-scale infrastructure — it is a complete, working CRUD + analytics application, built on a conventional Django REST Framework + React stack, with one opt-in AI feature layered on top of its own (non-AI) reporting data. The current project is deployed for production use/testing; it does not claim real bank connectivity or bank-account integration. See [AI Financial Analysis](#-ai-financial-analysis).

---

## ✨ Key Features

- **Authentication** — JWT-based register/login/refresh/logout with server-side token blacklisting, plus Google sign-in and password recovery/reset
- **Google Sign-In** — Google credential-based sign-in/register flow, with separate login/register handling and JWT issuance
- **Password Recovery** — forgot-password request, expiring reset tokens, reset-password flow, and authenticated password change
- **Expense tracking** — 8 categories, 4 payment methods, search, filtering, sorting, pagination
- **Income tracking** — 6 sources, full CRUD, search, sorting, pagination
- **Budgets** — one budget per user/category/month/year, with utilization tracking and threshold alerts
- **Savings Goals** — deposits/withdrawals against a target amount, with full transaction history
- **Achievements** — completed savings goals surfaced as a dedicated "wins" view
- **Dashboard** — month/year-navigable summary: income, expenses, net savings, budget progress, category spending, recent activity
- **Reports** — date-range-driven summary, trend chart, category/source breakdowns, budget performance, and CSV/Excel/PDF export
- **AI Financial Analysis** — opt-in, Gemini-backed plain-language read on a report's own data (observations, patterns, risks, recommendations); degrades gracefully with no key configured
- **Notifications** — in-app notification center with a live sidebar unread-count badge, plus opt-in email delivery through SendGrid for budget alerts, savings-goal milestones, achievements, and monthly reports
- **Profile & Settings** — profile picture, personal details, password change, appearance (theme), currency, and data export
- **Admin Dashboard** — separate role-gated view with platform-wide usage statistics
- **Landing Page & Contact Page** — public marketing pages with an integrated contact/feedback form
- **Light/Dark theme** — applied instantly across the whole app via CSS custom properties
- **Multi-currency display** — INR is the storage currency; other currencies are a live display-time conversion

---

## 🧩 Application Modules

| Module                 | Status             | Notes                                                                                                            |
| ---------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Authentication         | ✅ Implemented     | JWT + blacklist, RBAC via `Profile.role`, Google sign-in, password recovery/reset                                |
| Email Verification     | ✅ Implemented     | Register + email-change, expiring single-use tokens. See [Email Verification](#-email-verification)              |
| Dashboard              | ✅ Implemented     | Month/year navigation, live summary                                                                              |
| Expenses               | ✅ Implemented     | Full CRUD, filters, pagination                                                                                   |
| Income                 | ✅ Implemented     | Full CRUD, filters, pagination                                                                                   |
| Budgets                | ✅ Implemented     | Threshold-based alerts (80/90/100%)                                                                              |
| Savings Goals          | ✅ Implemented     | Deposit/withdrawal transactions                                                                                  |
| Achievements           | ✅ Implemented     | Derived from completed savings goals (no separate model)                                                         |
| Reports & Analytics    | ✅ Implemented     | Date-range driven, CSV/Excel/PDF export                                                                          |
| AI Financial Analysis  | ✅ Implemented     | Opt-in, Google Gemini-backed. See [AI Financial Analysis](#-ai-financial-analysis)                               |
| Notifications (in-app) | ✅ Implemented     | 11 types, priority levels, deduplication                                                                         |
| Email Notifications    | ✅ Implemented     | SendGrid HTTP API, verification-gated and per-category opt-in. See [Email Notifications](#-email-notifications)  |
| Profile                | ✅ Implemented     | Picture upload, personal details, password change                                                                |
| Settings               | ✅ Implemented     | Appearance, currency, data export                                                                                |
| Data Import            | ❌ Not implemented | UI shows a disabled button with an explanation                                                                   |
| Admin Dashboard        | ✅ Implemented     | Platform-wide stats, role-gated                                                                                  |
| Landing Page           | ✅ Implemented     | Public marketing page                                                                                            |
| Contact Page           | ✅ Implemented     | Includes merged feedback form (no separate Feedback page)                                                        |
| Theme (Light/Dark)     | ✅ Implemented     | `data-theme` attribute + CSS variables                                                                           |
| Automated test suite   | ✅ Implemented     | Backend suite: **160/160 passing**; frontend Vitest + Testing Library suite remains separately documented below. |

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
| Groq (`openai/gpt-oss-120b` by default) | AI Financial Analysis and Finora — server-side only via the Groq SDK. See [AI Financial Analysis](#-ai-financial-analysis) |
| SendGrid                                      | Email verification links and opt-in notification emails. See [Email Notifications](#-email-notifications)                                        |

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
   └─ ai_analysis.services.build_financial_snapshot() → ai_analysis.groq_client (external call)
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
 ├─▶ No activity in range           →  {"status": "insufficient_data"} — Groq is never called
 ├─▶ 180s per-user/per-range cache hit (and refresh=false) → cached payload returned, {"cached": true}
 └─▶ Otherwise: ai_analysis.groq_client.generate_financial_analysis(snapshot) calls Groq
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
│   ├── ai_analysis/          # AI Financial Analyst — Groq client, snapshot builder, single endpoint
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

**Registration → Login:** a new user registers, a `Profile` is auto-created via a Django signal (one-to-one with `User`, default role `student`), then logs in through the JWT endpoint. Existing users can also use the Google sign-in flow; the backend validates the Google credential and returns the same JWT access/refresh tokens.

**Logging a transaction:** creating an Expense or Income immediately (a) reflects in Dashboard/Reports on next fetch, and (b) fires a low-priority "Added" notification via `sync_entity_notification()`. Editing that same Expense/Income later re-syncs the identical notification (same `dedup_key`) rather than creating a new one, so the Notification Center never accumulates duplicate entries for one transaction.

**Budgets:** creating a Budget for a category/month/year, then adding Expenses in that category, triggers `check_and_notify_budget_alerts()` after each expense — it recalculates spend for that exact category/month/year and fires a deduplicated notification once each threshold (80% / 90% / 100%) is first crossed.

**Savings Goals:** a goal is created with a target amount; deposits/withdrawals are logged as `SavingsTransaction` rows against it. Completing a goal (`is_purchased=True`, `is_archived=True`) is what makes it appear under Achievements — there is no separate Achievement model.

**Reports:** selecting a period (Today/Week/Month/Year/Custom Range) resolves to `{date_from, date_to}` on the frontend, which is sent to `/api/v1/reports/summary/`. The single JSON response drives the summary cards, trend chart, category/source breakdowns, budget performance, and the three export formats.

---

## 🔑 Google Sign-In

BudgetBuddy supports Google sign-in through a backend-validated **OAuth 2.0 / OpenID Connect credential flow**. The frontend sends the Google credential to `POST /api/v1/users/google-login/`; the backend validates the Google identity credential, then either signs in the existing account or creates a Google-based account when the request is explicitly made in register mode. Successful authentication returns the normal BudgetBuddy JWT access and refresh tokens.

The backend distinguishes these cases explicitly:

- Login with an unregistered Google email → `404 account_not_found`
- Register with an already-registered Google email → `409 account_exists`
- Invalid Google credential → `400 google_authentication_failed`
- Successful authentication → JWT access/refresh tokens plus `is_new_user`

Google-created users have their email marked verified and do not rely on a local password for authentication.

## 🔁 Password Recovery & Reset

BudgetBuddy supports both authenticated password changes and unauthenticated password recovery.

- **Forgot password:** a user submits their email from the Forgot Password page to request a reset link.
- **Reset password:** the link opens the Reset Password page, where the user sets a new password using the reset token.
- **Security:** reset tokens are stored as hashed values and are time-limited/single-use according to the backend reset-token implementation; the raw token is used only in the reset link.
- **Change password:** authenticated users can change their password from Settings.
- Password reset/recovery is handled through the backend service and email template rather than exposing credentials in the frontend.

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

Email verification uses single-use, SHA-256-hashed, 24-hour-expiring tokens. The raw token is used only to construct the verification link and is never persisted.

- **Verification:** `POST /api/v1/users/verify-email/` with the raw token.
- **Resend:** `POST /api/v1/users/resend-verification/`, authenticated and subject to a 60-second cooldown.
- **Distinct states:** invalid, already-used, and expired tokens have separate user-facing handling.
- **Email change:** changing the account email resets verification status and issues a fresh verification token for the new address.
- **Notification-email gate:** notification emails require `Profile.email_verified=True`.
- **Registration behavior:** registration creates the verification state, but the current implementation does not automatically send a verification email from `RegisterSerializer.create()`. The user can initiate the resend-verification flow from the authenticated Settings/Profile flow.
- **Manual verification:** the verification flow was manually exercised end-to-end with a real delivered email.

## 📧 Email Notifications

**Implemented via SendGrid.** BudgetBuddy uses the custom `SendGridEmailBackend` in `backend/users/email_backends.py`, which sends through the SendGrid HTTP API rather than Gmail SMTP.

Supported high-signal email events include:

- Budget warning / exceeded
- Savings goal completion
- Achievements
- Monthly report ready

Email delivery is gated by:

1. the master `Profile.email_notifications` preference;
2. the relevant category preference; and
3. `Profile.email_verified=True`.

A failed email delivery is handled gracefully so it does not block the underlying in-app notification.

The `email_achievement_notifications` preference defaults to **True** in the current model.

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
- **Graceful degradation**: a missing `GROQ_API_KEY`, a network/HTTP error, or a malformed model response all raise `AIAnalysisUnavailable`, which the view turns into `{"status": "unavailable"}` — the rest of BudgetBuddy (including the underlying report data) is unaffected either way.
- **Caching**: successful results are cached server-side for 180 seconds per `(user, date_from, date_to, currency)`, so re-renders or accidental double-clicks don't spend an extra Groq call; the frontend's "Refresh Analysis" button passes `refresh=true` to bypass this.
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
- **Google sign-in:** the backend validates the Google OAuth 2.0 / OpenID Connect identity credential before issuing BudgetBuddy JWTs; Google authentication does not expose or store the user's Google password.
- **Password recovery:** reset tokens are hashed before persistence and are handled through the dedicated password-reset service and email template.
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

| Variable              | Required | Purpose                                                  | Example                                     |
| --------------------- | -------- | -------------------------------------------------------- | ------------------------------------------- |
| `SECRET_KEY`          | Yes      | Django cryptographic signing key                         | `your-secret-key`                           |
| `DEBUG`               | Yes      | Enables Django debug mode (`True`/`False`)               | `True`                                      |
| `ALLOWED_HOSTS`       | Yes      | Comma-separated list of allowed hostnames                | `127.0.0.1,localhost`                       |
| `DB_NAME`             | Yes      | PostgreSQL database name                                 | `budgetbuddy`                               |
| `DB_USER`             | Yes      | PostgreSQL username                                      | `postgres`                                  |
| `DB_PASSWORD`         | Yes      | PostgreSQL password                                      | `your_postgres_password`                    |
| `DB_HOST`             | Yes      | PostgreSQL host                                          | `localhost`                                 |
| `DB_PORT`             | Yes      | PostgreSQL port                                          | `5432`                                      |
| `EMAIL_BACKEND`       | No       | Email backend class                                      | `users.email_backends.SendGridEmailBackend` |
| `SENDGRID_API_KEY`    | No       | SendGrid API key                                         | `your-sendgrid-api-key`                     |
| `SENDGRID_FROM_EMAIL` | No       | Verified sender email address                            | `noreply@example.com`                       |
| `FRONTEND_URL`        | No       | Base URL used to build absolute links in emails          | `http://localhost:5173`                     |
| `GROQ_API_KEY`        | No       | Groq API key for Finora and AI Financial Analysis       | `your-groq-api-key`                         |
| `GOOGLE_CLIENT_ID`    | Yes\*    | Google sign-in client ID used by the authentication flow | `your-google-client-id`                     |
| `GROQ_MODEL`          | No       | Groq model name                                          | `openai/gpt-oss-120b` (default)             |

Email delivery uses the custom `SendGridEmailBackend`. If the SendGrid configuration is absent, the application can fall back to console email behavior for local development; real email delivery requires valid SendGrid configuration. `FRONTEND_URL` is used when building absolute links. See [Email Notifications](#-email-notifications).

`GROQ_API_KEY` defaults to an empty string if omitted — the project still runs, but the AI Financial Analysis feature returns `{"status": "unavailable"}` for every request instead of erroring. See [AI Financial Analysis](#-ai-financial-analysis).

---

## ✅ Testing & Verification

### Backend automated tests

The current backend suite was executed successfully:

```text
160 tests — OK
```

The suite covers the implemented backend applications and includes API, model, notification, reporting, authentication, Google sign-in, password recovery, and AI-analysis behavior.

Additional checks also pass:

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
```

### Frontend automated tests

The project uses **Vitest + Testing Library**.

Current verified result:

```text
50 / 50 tests passing
```

The Login test selectors were corrected so the password input is queried unambiguously; the full frontend suite now passes.

### Production/manual verification

The production frontend build was verified with:

```bash
npm run build
```

The deployed frontend has also been manually exercised using multiple accounts, and the deployed website was shared with other users who were able to access and use the frontend successfully.

These manual checks complement automated tests; they are not a substitute for formal QA certification or a complete automated E2E regression suite.

## ⚠️ Known Limitations

- **Frontend automated test suite:** 50/50 currently pass.
- **Frontend production build:** `npm run build` completes successfully.
- **Frontend lint:** `npm run lint` completes with **0 errors** and 17 warnings (mainly React Fast Refresh / hook-dependency warnings and a few unused imports).
- **No formal security audit:** application-level security controls are implemented, but no formal third-party security audit or penetration test was performed.
- **No automated E2E regression suite:** end-to-end workflows have been manually exercised, including multi-account and deployed-frontend testing.
- **AI Financial Analysis depends on Groq:** without a configured `GROQ_API_KEY` or when the service is unavailable, the feature degrades gracefully instead of affecting the rest of the application.
- **Notifications are not automatically scheduled:** monthly-report and savings-reminder management commands are available but are manually run; no Celery/APScheduler scheduler is wired in.
- **No data import:** "Export My Data" is implemented; corresponding import functionality is not implemented.
- **Reports exports are aggregate-oriented:** CSV/Excel/PDF are generated client-side from the report response; PDF does not include the Trend section that CSV/Excel include.
- **Report presets:** Week/Month/Year use the application's defined rolling/to-date behavior rather than always representing full calendar periods.
- **Screenshots:** repository screenshots are from earlier development stages and do not represent every current UI screen.
- **Architecture notes:** the registered `dashboard` backend app is an empty scaffold; dashboard logic lives in `analytics`. The `reports.models.Report` model is currently unused because reports are computed live.

## 🚀 Future Improvements

_(Planned enhancements, not required for Milestone 4 completion.)_

- Add automated regression coverage for Google sign-in and password recovery on the frontend.
- Add automated E2E regression coverage.
- Add a formal security audit / penetration testing process.
- Add Celery or APScheduler for automatic monthly-report and savings-reminder scheduling.
- Add data import to complement the existing data export.
- Add transaction-level line items to report exports.
- Refresh repository screenshots with the current UI.

## 📷 Screenshots

The `Screenshots/` directory contains images from early **Milestone 1** setup and API testing (Django welcome page, Postman requests for the auth endpoints, the initial React + Vite scaffold, `makemigrations`/`migrate` output). **They do not reflect the current UI** — no Dashboard, Reports, Landing Page, or other current-feature screenshots exist in this repository at this time.

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
