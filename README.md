# 💰 BudgetBuddy – Personal Budget Planning & Expense Management System

BudgetBuddy is a full-stack personal finance management application developed as part of the Infosys Springboard 7.0 Internship Program. The application helps users organize their finances by tracking income, expenses, budgets, and savings goals through a secure web-based platform built with Django REST Framework and React.

**Current Development Phase:**
Milestone 1 – Backend Foundation ✅

---

# 📖 Project Overview

BudgetBuddy is designed to simplify personal finance management by providing users with a centralized platform for monitoring their financial activities.

The application follows a **REST API architecture**, where the backend is built using **Django REST Framework** and the frontend is developed using **React + Vite**.

---

# ✨ Features

## ✅ Currently Implemented

- Django Backend Setup
- Django REST Framework Configuration
- SQLite Database Configuration
- React + Vite Frontend Setup
- JWT Authentication
- User Registration API
- User Login API
- Refresh Token API
- Database Models
- Django Admin Panel
- Initial Database Migrations

---

## 🚧 Planned Features

- Income Management
- Expense Management
- Budget Tracking
- Savings Goals Dashboard
- Reports & Analytics
- Notification System
- User Profile Management
- Responsive User Interface

---

# 🛠 Tech Stack

## Backend

- Python 3.13
- Django 6.0
- Django REST Framework
- Simple JWT Authentication
- Pillow
- SQLite

## Frontend

- React 19
- Vite
- JavaScript

## Tools

- Git
- GitHub
- VS Code

---

# 📂 Project Structure

```text
BudgetBuddy/
│
├── backend/
│   ├── budgets/                 # Budget and savings goal management
│   ├── config/                  # Django project configuration
│   ├── expenses/                # Income and expense management
│   ├── reports/                 # Reports and notifications
│   ├── users/                   # User authentication and profiles
│   ├── manage.py                # Django management script
│   └── requirements.txt         # Backend dependencies
│
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/                     # React application source code
│   ├── package.json             # Frontend dependencies and scripts
│   ├── vite.config.js           # Vite configuration
│   └── index.html               # Application entry point
│
├── Screenshots/                 # Project setup and development screenshots
│
├── README.md                    # Main project documentation
├── PROJECT_OVERVIEW.md          # Project overview, objectives, and architecture
├── INSTALLATION.md              # Installation and setup instructions
├── DEVELOPMENT_LOG.md           # Development progress and updates
└── .env.example                 # Sample environment variables
```

---

# 🗄 Database Design

The current database contains the following models.

### User Profile

Stores additional information about each registered user.

Key attributes:

- User
- Full Name
- Phone Number
- Profile Picture
- Created At

---

### Income

Stores user income records.

Fields include:

- User
- Source
- Amount
- Date

---

### Expense

Stores expense details.

Fields include:

- User
- Category
- Amount
- Date

---

### Budget

Stores monthly budget limits.

Fields include:

- User
- Category
- Monthly Limit

---

### Savings Goal

Stores savings targets.

Fields include:

- User
- Goal Name
- Target Amount
- Current Amount

---

### Report

Stores generated financial reports.

---

### Notification

Stores notifications for users.

---

# 🔐 Authentication

Authentication is implemented using **JSON Web Tokens (JWT)**.

Available endpoints:

| Method | Endpoint               | Description          |
| ------ | ---------------------- | -------------------- |
| POST   | `/api/users/register/` | Register User        |
| POST   | `/api/users/login/`    | Login                |
| POST   | `/api/users/refresh/`  | Refresh Access Token |

---

# 🚀 Running the Project

## Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver
```

Backend URL

```
http://127.0.0.1:8000/
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend URL

```
http://localhost:5173/
```

---

# 👨‍💻 Django Admin

Create an administrator account.

```bash
python manage.py createsuperuser
```

Open

```
http://127.0.0.1:8000/admin/
```

---

# 📷 Project Screenshots

The Screenshots directory contains the setup and development progress captured during Milestone 1, including:

- Project Structure
- requirements.txt
- React + Vite Setup
- Django Welcome Page
- Django Admin Login
- Django Admin Dashboard
- Database Migrations
- JWT Registration
- JWT Login
- JWT Token Refresh

---

# 📊 Milestone 1 Status

| Task                | Status |
| ------------------- | ------ |
| Backend Setup       | ✅     |
| React Setup         | ✅     |
| Database Design     | ✅     |
| JWT Authentication  | ✅     |
| Admin Configuration | ✅     |
| Initial APIs        | ✅     |
| Database Migration  | ✅     |

---

# 🎯 Next Development Phase

The following modules will be implemented in the next development phase.

- Income CRUD APIs
- Expense CRUD APIs
- Budget CRUD APIs
- Savings Goal CRUD APIs
- Reports Module
- Notification Module
- Dashboard UI
- Charts & Analytics
- User Profile Management

---

# 📚 Documentation

Additional project documentation is available in:

- PROJECT_SCOPE.md
- SETUP.md
- MILESTONE_1_COMPLETION.md

---

# 👩‍💻 Developer

**Akshata Lokhande**

B.Tech Information Technology

Madhav Institute of Technology & Science, Gwalior

Infosys Springboard 7.0 Internship Project

---

# 📄 License

This project is developed for educational and internship purposes.

---

🚀 This project is actively being developed as part of the Infosys Springboard 7.0 Internship Program.
