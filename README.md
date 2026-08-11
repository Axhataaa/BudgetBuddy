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
9. [Email Notifications](#-email-notifications)
10. [Reports & Analytics](#-reports--analytics)
11. [Data Export](#-data-export)
12. [Authentication & Security](#-authentication--security)
13. [Theme & Currency](#-theme--currency)
14. [Setup & Installation](#-setup--installation)
15. [Environment Variables](#-environment-variables)
16. [Testing & Verification](#-testing--verification)
17. [Known Limitations](#-known-limitations)
18. [Future Improvements](#-future-improvements)
19. [Screenshots](#-screenshots)
20. [Documentation Index](#-documentation-index)
21. [Developer](#-developer)
22. [License](#-license)

---

## 🧭 Project Overview

Managing personal finances across scattered spreadsheets, banking apps, and mental math makes it easy to lose track of where money actually goes. BudgetBuddy consolidates income, expenses, budgets, and savings goals into one place, and turns that data into readable reports rather than raw transaction lists.

**Who it's for:** individuals — students, freelancers, working professionals — who want a straightforward way to log transactions, set category budgets, and see whether they're on track, without needing a bank integration.

**What makes it more than a transaction log:**

- Budgets are tied to actual expense data, with automatic alerts at 80% / 90% / 100% usage.
- Savings goals track real deposit/withdrawal history, not just a target number, and completed goals become "Achievements."
- Reports compute income vs. expense trends, category breakdowns, and budget performance for any selected date range, and export that exact range to CSV, Excel, or PDF.
- A Django-backed Admin Dashboard gives a separate, role-gated monitoring view of platform-wide usage.

BudgetBuddy does not claim AI-powered insights, real bank connectivity, or production-scale infrastructure — it is a complete, working CRUD + analytics application built on a conventional Django REST Framework + React stack.

---

## ✨ Key Features

- **Authentication** — JWT-based register/login/refresh/logout with server-side token blacklisting
- **Expense tracking** — 8 categories, 4 payment methods, search, filtering, sorting, pagination
- **Income tracking** — 6 sources, full CRUD, search, sorting, pagination
- **Budgets** — one budget per user/category/month/year, with utilization tracking and threshold alerts
- **Savings Goals** — deposits/withdrawals against a target amount, with full transaction history
- **Achievements** — completed savings goals surfaced as a dedicated "wins" view
- **Dashboard** — month/year-navigable summary: income, expenses, net savings, budget progress, category spending, recent activity
- **Reports** — date-range-driven summary, trend chart, category/source breakdowns, budget performance, and CSV/Excel/PDF export
- **Notifications** — in-app notification center for budget alerts, savings-goal milestones, and general events
- **Profile & Settings** — profile picture, personal details, password change, appearance (theme), currency, and data export
- **Admin Dashboard** — separate role-gated view with platform-wide usage statistics
- **Landing Page & Contact Page** — public marketing pages with an integrated contact/feedback form
- **Light/Dark theme** — applied instantly across the whole app via CSS custom properties
- **Multi-currency display** — INR is the storage currency; other currencies are a live display-time conversion

---

## 🧩 Application Modules

| Module                 | Status             | Notes                                                     |
| ---------------------- | ------------------ | --------------------------------------------------------- |
| Authentication         | ✅ Implemented     | JWT + blacklist, RBAC via `Profile.role`                  |
| Dashboard              | ✅ Implemented     | Month/year navigation, live summary                       |
| Expenses               | ✅ Implemented     | Full CRUD, filters, pagination                            |
| Income                 | ✅ Implemented     | Full CRUD, filters, pagination                            |
| Budgets                | ✅ Implemented     | Threshold-based alerts (80/90/100%)                       |
| Savings Goals          | ✅ Implemented     | Deposit/withdrawal transactions                           |
| Achievements           | ✅ Implemented     | Derived from completed savings goals (no separate model)  |
| Reports & Analytics    | ✅ Implemented     | Date-range driven, CSV/Excel/PDF export                   |
| Notifications (in-app) | ✅ Implemented     | 3 types, priority levels, deduplication                   |
| Email Notifications    | ❌ Not implemented | See [Email Notifications](#-email-notifications)          |
| Profile                | ✅ Implemented     | Picture upload, personal details, password change         |
| Settings               | ✅ Implemented     | Appearance, currency, data export                         |
| Data Import            | ❌ Not implemented | UI shows a disabled button with an explanation            |
| Admin Dashboard        | ✅ Implemented     | Platform-wide stats, role-gated                           |
| Landing Page           | ✅ Implemented     | Public marketing page                                     |
| Contact Page           | ✅ Implemented     | Includes merged feedback form (no separate Feedback page) |
| Theme (Light/Dark)     | ✅ Implemented     | `data-theme` attribute + CSS variables                    |
| Automated test suite   | ❌ Not implemented | `tests.py` files exist but are empty stubs                |

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
 │  Axios + JWT (access token in memory, refresh via httpOnly-style flow)
 ▼
REST API  (/api/v1/...)
 │
 ▼
Django Backend (DRF ViewSets / APIViews)
 │
 ▼
Services / Business Logic
   ├─ notifications.notification_service.create_notification()
   ├─ budgets.notifications (threshold checks)
   └─ reports.services.get_report_data()
 │
 ▼
PostgreSQL Database
```

**Notifications** (in-app only — see [Email Notifications](#-email-notifications)):

```
Event (expense/income/budget/savings action)
 │
 ▼
create_notification()  →  Notification row (deduplicated via dedup_key)
 │
 ▼
GET /api/v1/notifications/  →  Notification Center (frontend)
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
│   │   ├── context/             # AuthContext, PreferencesContext
│   │   ├── hooks/                # useAuth, usePreferences
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

**Logging a transaction:** creating an Expense or Income immediately (a) reflects in Dashboard/Reports on next fetch, and (b) fires a low-priority "Added" notification via `create_notification()`.

**Budgets:** creating a Budget for a category/month/year, then adding Expenses in that category, triggers `check_and_notify_budget_alerts()` after each expense — it recalculates spend for that exact category/month/year and fires a deduplicated notification once each threshold (80% / 90% / 100%) is first crossed.

**Savings Goals:** a goal is created with a target amount; deposits/withdrawals are logged as `SavingsTransaction` rows against it. Completing a goal (`is_purchased=True`, `is_archived=True`) is what makes it appear under Achievements — there is no separate Achievement model.

**Reports:** selecting a period (Today/Week/Month/Year/Custom Range) resolves to `{date_from, date_to}` on the frontend, which is sent to `/api/v1/reports/summary/`. The single JSON response drives the summary cards, trend chart, category/source breakdowns, budget performance, and the three export formats.

---

## 🔔 Notification System

Implemented as the `notifications` Django app (`Notification` model + `NotificationViewSet`).

**Notification types** (`Notification.NotificationType`, exact backend values):

| Value          | Used for                                                                       |
| -------------- | ------------------------------------------------------------------------------ |
| `budget_alert` | Budget Created, Budget Warning/High Warning/Exceeded                           |
| `savings_goal` | Goal Created, Deposit Added, Withdrawal Made, Goal Completed, Savings Reminder |
| `general`      | Expense Added, Income Added, Monthly Report Ready                              |

**Priority levels** (`Notification.Priority`): `low`, `medium`, `high`. Budget Exceeded and Budget High Warning are `high`; Budget Warning is `medium`; routine "Added" events default to `low`/`medium`.

**Other implemented behavior:**

- `title`, `message`, `action_url` (deep-links the notification to the relevant page, e.g. `/budgets`, `/savings-goals`)
- `is_read` with mark-read / mark-all-read / clear-all actions (`NotificationViewSet`)
- **Deduplication** via a `dedup_key` field with a DB-level unique constraint (`unique_user_dedup_key`) — e.g. a given budget only ever fires one notification per threshold tier, no matter how many further expenses are logged
- Server-side filtering by `notification_type` / `is_read` (`NotificationFilter`)

**Two management commands generate periodic notifications** (run manually or via an external scheduler — see [Known Limitations](#-known-limitations)):

- `python manage.py generate_monthly_report_notifications` — one "Monthly Report Ready" notification per non-admin user, deduplicated per month
- `python manage.py send_savings_reminders [--days N]` — a reminder for active savings goals with no deposit in `N` days (default 7), deduplicated per goal per calendar week

---

## 📧 Email Notifications

**Not implemented.** There is no SMTP configuration, no `send_mail`/`EmailMessage` usage, and no email templates anywhere in the backend. `settings.py` has no `EMAIL_*` configuration block at all.

The only related artifact is `Profile.email_notifications` (a `BooleanField`, default `True`) — a preference toggle that currently has nothing wired to it. It should be treated as a placeholder for a future feature, not a working setting.

Any documentation, prior notes, or external references describing HTML email templates, Brevo/Gmail SMTP delivery, or category-specific email preferences do **not** reflect this codebase and should not be relied upon.

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

A full personal-data backup, unrelated to the Reports page. Pulls **every page** of the user's Expenses, Incomes, Budgets, and Savings Goals via the existing list endpoints, and downloads one JSON file.

- **Does not** include Profile fields, Notifications, or authentication data.
- **Does not** include passwords, tokens, or any system-level data.
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

| Variable        | Required | Purpose                                    | Example                  |
| --------------- | -------- | ------------------------------------------ | ------------------------ |
| `SECRET_KEY`    | Yes      | Django cryptographic signing key           | `your-secret-key`        |
| `DEBUG`         | Yes      | Enables Django debug mode (`True`/`False`) | `True`                   |
| `ALLOWED_HOSTS` | Yes      | Comma-separated list of allowed hostnames  | `127.0.0.1,localhost`    |
| `DB_NAME`       | Yes      | PostgreSQL database name                   | `budgetbuddy`            |
| `DB_USER`       | Yes      | PostgreSQL username                        | `postgres`               |
| `DB_PASSWORD`   | Yes      | PostgreSQL password                        | `your_postgres_password` |
| `DB_HOST`       | Yes      | PostgreSQL host                            | `localhost`              |
| `DB_PORT`       | Yes      | PostgreSQL port                            | `5432`                   |

There are currently no `EMAIL_*`, `FRONTEND_URL`, or third-party API-key variables in `settings.py` — see [Email Notifications](#-email-notifications).

---

## ✅ Testing & Verification

**Automated tests:** each Django app has a `tests.py`, but they are all empty framework stubs (no real test cases). There is currently no automated test suite, backend or frontend.

**Manual verification performed on this codebase:**

```bash
# Backend
python manage.py check
python manage.py makemigrations --check --dry-run

# Frontend
npm run build      # Vite production build
npx oxlint          # Linting
```

These confirm the project has no system-check errors, no un-generated model migrations, and that the frontend builds cleanly for production. They are **not** a substitute for a real test suite, and do not verify runtime behavior against a live database.

---

## ⚠️ Known Limitations

- **No email notifications** — see [Email Notifications](#-email-notifications). The `email_notifications` preference field exists but is not wired to anything.
- **No automated test suite** — `tests.py` files are present but empty across every backend app.
- **Notifications are not scheduled automatically** — the monthly-report and savings-reminder commands must be run manually (or wired to an external scheduler like cron/Task Scheduler); there is no Celery/APScheduler integration.
- **No data import** — "Export My Data" works; the corresponding import is UI-disabled with no backend support.
- **Reports exports are aggregate-only** — no per-transaction line items in CSV/Excel/PDF, and the PDF omits the Trend section that CSV/Excel include.
- **"Week"/"Month"/"Year" report presets are rolling/to-date windows**, not always full calendar periods (see [Reports & Analytics](#-reports--analytics)).
- **No production deployment** — the project currently runs via Django's dev server and Vite's dev server only; no deployment configuration (WSGI/ASGI server, static file hosting, HTTPS) is included.
- **Screenshots are outdated** — see [Screenshots](#-screenshots).
- **The `dashboard` backend app is an empty scaffold** — registered but contains no models, views, or URLs; all dashboard logic actually lives in the `analytics` app.

---

## 🚀 Future Improvements

_(Explicitly planned, not implemented.)_

- Real email delivery (SMTP/Brevo) wired to the existing `email_notifications` preference
- Celery or APScheduler for automatic monthly-report/savings-reminder scheduling instead of manual command runs
- Data import to complement the existing data export
- Automated backend (pytest/Django test runner) and frontend test coverage
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
