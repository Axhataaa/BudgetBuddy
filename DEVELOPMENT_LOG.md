# 📒 Development Log

## Progress Timeline

### Milestone 1 — Project Setup & Authentication

- Django + DRF project initialized (apps: `users`, `expenses`, `incomes`, `budgets`, `analytics`, `reports`)
- PostgreSQL configured via `.env`
- JWT authentication (register, login, refresh, logout) implemented
- Google sign-in flow added with backend credential validation and JWT issuance
- Password recovery/reset and authenticated password-change flows implemented
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
- **Notifications**: in-app notification center (11 types — 3 legacy, 8 current) with priority levels, deduplication via `dedup_key`, two management commands for periodic events (monthly report ready, savings reminders), plus opt-in email delivery via SendGrid for budget alerts, savings-goal completion, achievements, and monthly reports
- **Landing Page & Contact Page**: public marketing page, theme toggle, and a contact page with an integrated message form (feedback merged into Contact rather than kept as a separate page)
- **Logout behavior**: unauthenticated/post-logout redirect changed from `/login` to `/` (the public Landing Page) across `ProtectedRoute` and `AdminProtectedRoute`
- **Theme system**: Light/Dark/System, applied via a `data-theme` attribute and CSS custom properties, reconciled with the backend `Profile.theme` field

✅ Completed — see [MILESTONE_3_COMPLETION.md](MILESTONE_3_COMPLETION.md)

---

### Milestone 4 — Deployment, Testing & Final Documentation

- **Analytics & Dashboard:** finalized live backend-driven dashboard summaries and the 6-month income-vs-expenses trend chart using the reports data.
- **Reports:** finalized date-range reporting, trend gap-filling, category/source breakdowns, budget performance, derived insights, and client-side CSV/Excel/PDF exports.
- **AI Financial Analysis:** implemented the opt-in, on-demand Gemini analysis endpoint with caching, currency-aware/capped report snapshots, and graceful unavailable/insufficient-data states.
- **Email Verification:** implemented single-use SHA-256-hashed, 24-hour-expiring verification tokens, resend cooldown, distinct invalid/expired/already-used handling, and email-change re-verification.
- **Email Notifications:** migrated the project from the earlier Gmail SMTP approach to the current custom **SendGridEmailBackend** using the SendGrid HTTP API; delivery is gated by email verification and per-category preferences.
- **Notifications:** finalized entity-linked/self-syncing notifications, deduplication, read/unread state, sidebar unread-count badge, threshold alerts, monthly-report notifications, and savings reminders.
- **Data Export:** wired the existing personal data export service to its API endpoint and frontend client.
- **Bug fixes:** stabilized same-date expense ordering and corrected dark-mode transaction-table contrast.
- **Production:** configured and deployed the frontend/backend with production environment variables, PostgreSQL, CORS/CSRF configuration, and a verified Vite production build.
- **Authentication enhancements:** added Google sign-in with explicit login/register modes, plus Forgot Password / Reset Password and authenticated Change Password flows.
- **Testing:** backend suite finally verified at **160/160 passing**; Google sign-in tests cover new-user creation, existing-user reuse, and invalid credentials.
- **Frontend verification:** `npm run build` succeeds; `npm run lint` reports **0 errors** (17 warnings remain).
- **Manual verification:** the deployed application was exercised with multiple accounts and shared with other users who successfully accessed and used the frontend.
- **Git finalization:** final authentication/password-recovery changes were committed and pushed to both the shared `Akshata` branch and the personal `main` branch.
- **Documentation:** project Markdown documentation was audited and updated to match the final implementation.

✅ **Completed** — see [MILESTONE_4_COMPLETION.md](MILESTONE_4_COMPLETION.md)
