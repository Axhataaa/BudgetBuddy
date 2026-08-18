# 📒 Development Log

## Progress Timeline

### Milestone 1 — Project Setup & Authentication

- Django + DRF project initialized (apps: `users`, `expenses`, `incomes`, `budgets`, `analytics`, `reports`)
- PostgreSQL configured via `.env`
- JWT authentication (register, login, refresh, logout) implemented
- `Profile` model auto-created via signal on user registration
- React + Vite frontend initialized with routing and Axios

✅ Completed — see [MILESTONE_1_COMPLETION.md](MILESTONE_1_COMPLETION.md)

---

### Milestone 2 — Core Finance Management Modules

- Expense management: full CRUD, 8 categories, 4 payment methods, filtering, search, pagination
- Income management: full CRUD, 6 sources, search, pagination
- Budget management: one budget per user/category/month/year, utilization tracking
- Dashboard: month/year-navigable summary (income, expenses, net savings, budget progress, category spending, recent activity)
- Profile management: picture upload, personal details, password change
- Indian currency formatting, shared reusable components, shared period selector

✅ Completed — see [MILESTONE_2_COMPLETION.md](MILESTONE_2_COMPLETION.md)

---

### Milestone 3 — Savings Goals, Reports, Notifications, Landing Page

- **Savings Goals**: target amount, deposit/withdrawal transactions, completed goals surfaced as Achievements
- **Reports**: date-range aggregation endpoint (`reports.services.get_report_data`), trend chart, category/source breakdowns, budget performance, derived insights
- **Data Export**: client-side CSV, Excel (multi-sheet), and PDF export from the Reports page, all reading the same date-scoped data as the on-screen charts
- **Notifications**: in-app notification center (11 types — 3 legacy, 8 current) with priority levels, deduplication via `dedup_key`, two management commands for periodic events (monthly report ready, savings reminders), plus opt-in email delivery (Gmail SMTP) for budget alerts, savings-goal completion, achievements, and monthly reports
- **Landing Page & Contact Page**: public marketing page, theme toggle, and a contact page with an integrated message form (feedback merged into Contact rather than kept as a separate page)
- **Logout behavior**: unauthenticated/post-logout redirect changed from `/login` to `/` (the public Landing Page) across `ProtectedRoute` and `AdminProtectedRoute`
- **Theme system**: Light/Dark/System, applied via a `data-theme` attribute and CSS custom properties, reconciled with the backend `Profile.theme` field

✅ Completed — see [MILESTONE_3_COMPLETION.md](MILESTONE_3_COMPLETION.md)

---

### Milestone 4 — Deployment, Testing & Final Documentation

- **Dashboard**: added a "Income vs Expenses — Last 6 Months" trend chart, reusing the existing Reports summary endpoint (`getLastNMonthsRange(6)` + `fillMissingMonths()` in `Dashboard.jsx`) rather than a new backend endpoint
- **Reports**: trend gap-filling (`fillTrendGaps()` in `Reports.jsx`) so periods with no income/expense activity render as real zero values instead of being silently absent from the chart
- **Reports**: dark-mode text-contrast fix for the transaction table header (Bootstrap's `--bs-emphasis-color` wasn't remapped by this project's own `[data-theme="dark"]`, so header text stayed light-mode black; scoped to `.transaction-table` only, see `index.css`)
- **AI Financial Analysis**: new `ai_analysis` app — an opt-in, on-demand Gemini-backed analysis of a Reports-page snapshot (`POST /api/v1/ai-analysis/analyze/`), with a 180s per-user/range/currency cache, graceful `insufficient_data`/`unavailable` states when there's no activity or no API key, and a covering `AIFinancialAnalysisEndpointTests` suite
- **Email Verification**: single-use, SHA-256-hashed, 24-hour-expiring tokens on registration and on email change, with resend (60s cooldown) and distinct invalid/expired/already-used handling (`users/email_verification_service.py`)
- **Notifications**: email delivery is now gated behind `Profile.email_verified`, in addition to the existing per-category preference toggles — an unverified account never receives a notification email regardless of its preferences
- **Notifications**: added nullable `expense`/`income`/`budget`/`savings_goal` FKs on `Notification` plus a new `sync_entity_notification()` helper (`update_or_create()` on a stable `dedup_key`) so editing an expense, income, budget, or savings goal updates its existing "Added"/"Created" notification instead of inserting a duplicate; `create_notification()` is unchanged and still used for threshold alerts, reminders, monthly reports, and achievements
- **Notifications**: added a live unread-count badge to the sidebar (`NotificationsContext`/`useNotifications`, following the existing `AuthContext`/`PreferencesContext` pattern) — exact count up to 19, then "19+", hidden at 0, refreshed on mount, after read/delete actions, and via a 30-second poll
- **Expenses**: fixed a same-date sort-order bug — `ExpenseViewSet.filter_queryset()` now re-appends `created_at` as a directional tiebreaker when `?ordering=date`/`-date` is requested, since DRF's `OrderingFilter` was dropping the model's default secondary ordering; covered by `ExpenseSameDateOrderingTests`
- **Settings/Profile**: email verification status surfaced in Settings, with resend action; changing the account email now re-triggers verification and reverts `email_verified` to `False` until the new address is confirmed
- **Data Export bugfix**: wired the pre-existing `users/data_export_service.py` to a new `ExportDataView`/`GET /api/v1/users/me/export-data/` route — the service and the frontend client both already existed but were never connected
- Manual verification performed: `python manage.py check`, `python manage.py makemigrations --check --dry-run`, `npm run build` (Vite production build); email verification manually tested end-to-end with a real Gmail-delivered email
- Documentation audited and rewritten against the actual source code (this pass, and a follow-up pass correcting an inaccurate JWT-storage claim and adding missing Email Verification coverage)
- **Not yet done**: automated tests for `budgets`, `incomes`, `reports`, and `users` (still empty stubs); no frontend test suite; production deployment configuration; production CORS configuration

🚧 In Progress — see [MILESTONE_4_COMPLETION.md](MILESTONE_4_COMPLETION.md)
