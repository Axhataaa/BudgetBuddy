# 📋 Project Overview

## Project Title

**BudgetBuddy – Personal Budget Planning & Expense Management Platform**

---

## About the Project

BudgetBuddy is a full-stack personal finance management application developed as part of the **Infosys Springboard 7.0 Internship Program**.

The application enables users to manage their personal finances through a secure, responsive, web interface. Users can:

- Track income and expenses
- Manage category-wise monthly budgets, with automatic threshold alerts
- Set and fund savings goals, and review completed goals as achievements
- View a month/year-navigable dashboard summary, including a 6-month income vs. expenses trend chart
- Generate date-range reports with trend charts, category/source breakdowns, and budget performance, and export them as CSV, Excel, or PDF
- Request an opt-in, Gemini-backed AI Financial Analysis of that same report data, on demand
- Receive in-app notifications for budget alerts, savings-goal events, achievements, and monthly reports, with opt-in email delivery for a subset of these
- Verify their email address through the single-use, expiring verification flow; email changes automatically require re-verification
- Manage their profile, theme (light/dark), display currency, and export a personal data backup

The application follows a RESTful architecture: **Django REST Framework** for the backend, **React (Vite)** for the frontend, communicating exclusively over JSON APIs secured with JWT.

For a full accuracy-checked feature list and technical detail, see **[README.md](README.md)**.

---

## Project Objectives

- Build a secure, working personal-finance management application
- Simplify day-to-day financial tracking (income, expenses, budgets, savings)
- Provide meaningful, date-range-scoped financial reporting rather than raw transaction dumps
- Implement JWT authentication with server-side token blacklisting
- Develop scalable, ownership-scoped REST APIs
- Build a responsive, theme-aware frontend
- Apply reusable components and shared services for maintainability
- Follow milestone-based, incremental full-stack development practices

---

## Target Users

Individuals who want to track and organize their personal finances — students, freelancers, and working professionals — without needing bank account integration.

---

## Core Modules

### Authentication

Registration, JWT access/refresh, server-side logout (token blacklisting), Google sign-in, password change, and password recovery/reset. See [README.md § Authentication & Security](README.md#-authentication--security).

### Google Sign-In

Google sign-in is supported through a backend-validated credential flow. The frontend sends the Google credential to the dedicated Google login endpoint; the backend validates it, handles login/register mode explicitly, and returns BudgetBuddy JWT access/refresh tokens. Google-created accounts are marked email-verified and do not require a local password.

### Password Recovery & Reset

Users can request a password-reset link from the Forgot Password page, set a new password from the Reset Password page, or change their password while authenticated from Settings. Reset-token handling is implemented in a dedicated backend service and email template.

### Email Verification

Single-use, expiring (24h), SHA-256-hashed tokens are used for verification; resend is available with a 60-second cooldown, and invalid/expired/already-used states are handled distinctly. The current registration flow does not automatically send the verification email; users can initiate resend from the authenticated Settings/Profile flow. Gates notification emails until verified. See [README.md § Email Verification](README.md#-email-verification).

### User Profile & Settings

Profile picture, username/email/full name/phone/bio, password change, appearance (light/dark theme), display currency, and a personal data export.

### Expense Management

Full CRUD, 8 categories, 4 payment methods, search, category/payment-method/time-period filtering, custom date range, sorting, pagination.

### Income Management

Full CRUD, 6 sources, search, sorting, pagination.

### Budget Management

One budget per user/category/month/year, with utilization tracking and automatic alerts at 80% / 90% / 100% usage.

### Savings Goals & Achievements

Deposit/withdrawal transactions against a target amount; a completed, archived goal is what surfaces under Achievements — there is no separate Achievement model.

### Dashboard

Month/year-navigable financial overview: total income, total expenses, net savings, budget progress, category spending, recent transactions, and a 6-month income vs. expenses trend chart built from the same reports API used by the Reports page.

### Reports & Analytics

Date-range-driven (Today/Week/Month/Year/Custom Range) summary, income vs. expense trend, category/source breakdowns, budget performance, and derived insights — all from one backend endpoint, exported client-side as CSV, Excel, or PDF from that same data.

### AI Financial Analysis

An opt-in, on-demand feature on the Reports page: the user requests a Gemini-generated, plain-language read of their own report data for the selected range (observations, patterns, risks, recommendations, savings strategy). Nothing runs automatically or in the background, no figures are invented beyond what's in the underlying report snapshot, and the feature degrades to a graceful "unavailable" message if no API key is configured. See [README.md § AI Financial Analysis](README.md#-ai-financial-analysis).

### Notifications

In-app notification center covering 11 types (3 legacy values kept for backward compatibility, plus 8 current types such as `budget_warning`, `budget_exceeded`, `achievement`, and `monthly_report`), priority levels, and deduplication. Entity-linked notifications (expense/income/budget/savings-goal added or edited) are kept in sync in place via `sync_entity_notification()` rather than duplicated on every edit, and a sidebar unread-count badge reflects the current total. Two management commands generate periodic notifications (monthly report ready, savings reminders) — run manually or via an external scheduler. A subset of high-signal events (budget warning/exceeded, savings goal completed, achievements, monthly report) also send email via SendGrid, gated behind email verification and per-category user preferences.

### Admin Dashboard

A separate, role-gated (`Profile.role == "admin"`) view with platform-wide usage statistics, distinct from the regular user Dashboard.

### Landing Page & Contact Page

A public marketing landing page and a contact page with an integrated message form (general question / feedback / feature request / bug report / collaboration / other) — feedback was deliberately merged into Contact rather than kept as a separate page.

---

## Technology Stack

See **[README.md § Tech Stack](README.md#-tech-stack)** for the full, version-accurate table. Summary:

**Backend:** Python, Django, Django REST Framework, Simple JWT, PostgreSQL, Pillow
**Frontend:** React, Vite, Bootstrap, Axios, React Router, Recharts, jsPDF, SheetJS (xlsx)
**External services:** Google (sign-in credential validation), Google Gemini (AI Financial Analysis), SendGrid (transactional email)
**Tools:** Git, GitHub, VS Code, Postman, pgAdmin 4

---

## Project Architecture

Each major feature is implemented as an independent Django app on the backend, mirrored by a dedicated page/service pair on the frontend:

```
users            → Authentication, Profile (role/theme/currency)
expenses         → Expense CRUD
incomes          → Income CRUD
budgets          → Budget, SavingsGoal, SavingsTransaction + alert logic
analytics        → Dashboard summary, recent activity, admin stats
reports          → Date-range report aggregation
ai_analysis      → AI Financial Analyst (Gemini snapshot + single endpoint)
notifications    → Notification model, service, management commands
common           → Shared formatting helpers (e.g. INR formatting)
dashboard        → Registered but currently unused (no models/views/urls)
```

The frontend communicates with the backend exclusively through REST APIs under `/api/v1/`, secured using JWT. Reusable components (`components/ui`), shared services (`services/*Service.js`), and utility modules (`utils/`) are used throughout to keep the frontend consistent — e.g. every export format shares the same currency-conversion helper, and every list page shares the same date-range utility.

---

## Development Methodology

The project was developed incrementally using milestone-based development. See **[DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)** for the detailed timeline and the individual `MILESTONE_*_COMPLETION.md` files for per-milestone deliverables.

| Milestone | Scope                                                                           | Status                                                                     |
| --------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1         | Project setup, authentication foundation                                        | ✅ Completed                                                               |
| 2         | Core finance management modules (Expenses, Income, Budgets, Dashboard, Profile) | ✅ Completed                                                               |
| 3         | Savings Goals, Reports, Notifications, Landing Page & Contact Page              | ✅ Completed                                                               |
| 4         | Deployment, automated testing, final optimization                               | ✅ Completed — deployed, tested, documented, and production build verified |
