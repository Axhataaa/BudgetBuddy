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

- PostgreSQL Database Name
- Database Username
- Database Password
- Database Host
- Database Port
- Django Secret Key
- Debug Mode

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
- Register a new user
- Login
- Create Income
- Create Expense
- Create Budget
- Open Dashboard
- Verify profile management

If all of the above work correctly, the project has been configured successfully.
