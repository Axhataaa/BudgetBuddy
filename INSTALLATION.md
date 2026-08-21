# ⚙️ Installation Guide

This guide explains how to set up and run the **BudgetBuddy** application locally.

---

# Prerequisites

Make sure the following software is installed:

- Python 3.13 or later
- Node.js (LTS)
- PostgreSQL
- Git
- npm

---

# Clone the Repository

```bash
git clone <repository-url>
```

Move into the project directory.

```bash
cd BudgetBuddy
```

---

# Backend Setup

Navigate to the backend directory.

```bash
cd backend
```

## Create Virtual Environment

```bash
python -m venv venv
```

## Activate Virtual Environment

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

---

## Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

## Configure Environment Variables

Create a `.env` file inside the `backend` directory.

Use `.env.example` as the reference.

Typical configuration includes:

- Django Secret Key
- Debug Mode
- Allowed Hosts
- PostgreSQL Database Name
- Database Username
- Database Password
- Database Host
- Database Port

See the [Environment Variables](README.md#-environment-variables) table in the README for the exact variable names and an example value for each.

### Optional: Email configuration (SendGrid)

The current production email implementation uses the custom `SendGridEmailBackend`. Configure:

- `EMAIL_BACKEND=users.email_backends.SendGridEmailBackend`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `FRONTEND_URL`

For local development, email delivery can fall back to the console backend when SendGrid configuration is omitted. Never commit real API keys or credentials.

### Optional: AI Financial Analysis (Gemini)

`GEMINI_API_KEY` is also optional. If omitted, the rest of the app works normally — the AI Financial Analysis feature on the Reports page simply responds with a "temporarily unavailable" message instead of an analysis. To enable it, add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, default `gemini-3.6-flash`) to `.env`.

---

## Apply Database Migrations

```bash
python manage.py migrate
```

---

## Start the Backend Server

```bash
python manage.py runserver
```

Backend runs at

```
http://127.0.0.1:8000/
```

---

# Frontend Setup

Open a new terminal.

Navigate to the frontend.

```bash
cd frontend
```

---

## Install Node Packages

```bash
npm install
```

---

## Start Development Server

```bash
npm run dev
```

Frontend runs at

```
http://localhost:5173/
```

---

# Django Administration

Create an administrator account.

```bash
python manage.py createsuperuser
```

Admin Panel

```
http://127.0.0.1:8000/admin/
```

---

# Default Workflow

## Terminal 1

```bash
cd backend

venv\Scripts\activate

python manage.py runserver
```

## Terminal 2

```bash
cd frontend

npm run dev
```

---

# Project Verification

After both servers are running:

- Open the frontend
- Register a new user, then use the authenticated Settings/Profile verification flow to request a verification email. With SendGrid configured, check the configured inbox and confirm the verification link marks the account verified
- Login
- Create Income
- Create Expense
- Create Budget (then add an Expense in that category to see budget alerts at 80%/90%/100%)
- Open Dashboard, including the "Income vs Expenses — Last 6 Months" chart
- Create a Savings Goal and log a deposit
- Open Reports, switch between Today / Week / Month / Year / Custom Range, and try each export (CSV/Excel/PDF)
- On the Reports page, click "Analyze My Finances" to try the AI Financial Analysis feature (requires `GEMINI_API_KEY` in `.env` — without it, the feature responds with a graceful "temporarily unavailable" message instead of an error)
- Check the Notification Center for the events above
- In Settings, enable a notification email preference and confirm the corresponding event (e.g. a budget exceeded) triggers an email once the account's email is verified
- Verify profile management and the Light/Dark theme toggle

If all of the above work correctly, the project has been configured successfully.

## Additional backend checks

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
```

Both should complete with no errors and no un-generated migrations. For the current automated test results, see [Testing & Verification](README.md#-testing--verification) in the README.
