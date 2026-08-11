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
- View a month/year-navigable dashboard summary
- Generate date-range reports with trend charts, category/source breakdowns, and budget performance, and export them as CSV, Excel, or PDF
- Receive in-app notifications for budget alerts and savings-goal events
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

Registration, login, JWT access/refresh, server-side logout (token blacklisting), password change. See [README.md § Authentication & Security](README.md#-authentication--security).

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

Month/year-navigable financial overview: total income, total expenses, net savings, budget progress, category spending, recent transactions.

### Reports & Analytics

Date-range-driven (Today/Week/Month/Year/Custom Range) summary, income vs. expense trend, category/source breakdowns, budget performance, and derived insights — all from one backend endpoint, exported client-side as CSV, Excel, or PDF from that same data.

### Notifications

In-app notification center covering three types (`budget_alert`, `savings_goal`, `general`), priority levels, and deduplication. Two management commands generate periodic notifications (monthly report ready, savings reminders) — run manually or via an external scheduler; **no email delivery is implemented**.

### Admin Dashboard

A separate, role-gated (`Profile.role == "admin"`) view with platform-wide usage statistics, distinct from the regular user Dashboard.

### Landing Page & Contact Page

A public marketing landing page and a contact page with an integrated message form (general question / feedback / feature request / bug report / collaboration / other) — feedback was deliberately merged into Contact rather than kept as a separate page.

---

## Technology Stack

See **[README.md § Tech Stack](README.md#-tech-stack)** for the full, version-accurate table. Summary:

**Backend:** Python, Django, Django REST Framework, Simple JWT, PostgreSQL, Pillow
**Frontend:** React, Vite, Bootstrap, Axios, React Router, Recharts, jsPDF, SheetJS (xlsx)
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
notifications    → Notification model, service, management commands
common           → Shared formatting helpers (e.g. INR formatting)
dashboard        → Registered but currently unused (no models/views/urls)
```

The frontend communicates with the backend exclusively through REST APIs under `/api/v1/`, secured using JWT. Reusable components (`components/ui`), shared services (`services/*Service.js`), and utility modules (`utils/`) are used throughout to keep the frontend consistent — e.g. every export format shares the same currency-conversion helper, and every list page shares the same date-range utility.

---

## Development Methodology

The project was developed incrementally using milestone-based development. See **[DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)** for the detailed timeline and the individual `MILESTONE_*_COMPLETION.md` files for per-milestone deliverables.

| Milestone | Scope                                                                           | Status                                                                 |
| --------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1         | Project setup, authentication foundation                                        | ✅ Completed                                                           |
| 2         | Core finance management modules (Expenses, Income, Budgets, Dashboard, Profile) | ✅ Completed                                                           |
| 3         | Savings Goals, Reports, Notifications, Landing Page & Contact Page              | ✅ Completed                                                           |
| 4         | Deployment, automated testing, final optimization                               | 🚧 In Progress — see [Known Limitations](README.md#-known-limitations) |
