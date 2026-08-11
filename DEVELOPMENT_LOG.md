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
- **Notifications**: in-app notification center (`budget_alert` / `savings_goal` / `general`), priority levels, deduplication via `dedup_key`, two management commands for periodic events (monthly report ready, savings reminders)
- **Landing Page & Contact Page**: public marketing page, theme toggle, and a contact page with an integrated message form (feedback merged into Contact rather than kept as a separate page)
- **Logout behavior**: unauthenticated/post-logout redirect changed from `/login` to `/` (the public Landing Page) across `ProtectedRoute` and `AdminProtectedRoute`
- **Theme system**: Light/Dark/System, applied via a `data-theme` attribute and CSS custom properties, reconciled with the backend `Profile.theme` field

✅ Completed — see [MILESTONE_3_COMPLETION.md](MILESTONE_3_COMPLETION.md)

---

### Milestone 4 — Deployment, Testing & Final Documentation

- Manual verification performed: `python manage.py check`, `python manage.py makemigrations --check --dry-run`, `npm run build` (Vite production build)
- Documentation audited and rewritten against the actual source code (this pass)
- **Not yet done**: automated test suite (backend or frontend), production deployment configuration

🚧 In Progress — see [MILESTONE_4_COMPLETION.md](MILESTONE_4_COMPLETION.md)
