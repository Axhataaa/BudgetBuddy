# 💰 BudgetBuddy – Personal Budget Planning & Expense Management System

BudgetBuddy is a full-stack personal finance management application developed as part of the **Infosys Springboard 7.0 Internship Program**.

The application enables users to efficiently manage their personal finances by tracking income, expenses, budgets, and savings goals through a secure web-based platform built using **Django REST Framework**, **React**, and **PostgreSQL**.

> 🚀 **Project Status:** Currently under active development.

---

# 📖 Project Overview

BudgetBuddy is designed to simplify personal finance management by providing users with a centralized platform to organize and monitor their financial activities.

The project follows a **RESTful API architecture**, where:

- **Backend:** Django + Django REST Framework
- **Frontend:** React + Vite
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)

---

# ✨ Current Features

## Backend

- Django Project Setup
- Django REST Framework Configuration
- PostgreSQL Database Integration
- JWT Authentication
- User Registration API
- User Login API
- Token Refresh API
- Database Models
- Django Admin Configuration
- Initial Database Migrations

## Frontend

- React + Vite Setup
- React Router Configuration
- Axios Integration
- User Registration Page
- User Login Page
- Dashboard Routing
- JWT Token Storage

---

# 🚧 Planned Features

- Income Management
- Expense Management
- Budget Management
- Savings Goals
- Reports & Analytics
- Notification System
- User Profile Management
- Dashboard Visualization
- Responsive User Interface

---

# 🛠 Technology Stack

## Backend

- Python 3.13
- Django 6
- Django REST Framework
- Simple JWT
- Pillow

## Frontend

- React 19
- Vite
- JavaScript
- Axios
- React Router DOM

## Database

- PostgreSQL

## Tools

- Git
- GitHub
- VS Code
- Postman
- pgAdmin 4

---

# 📂 Project Structure

```text
BudgetBuddy/
│
├── backend/
│   ├── budgets/                 # Budget and savings goal management
│   ├── config/                  # Django project configuration
│   ├── expenses/                # Income and expense management
│   ├── reports/                 # Reports and notification management
│   ├── users/                   # User authentication and profile management
│   ├── manage.py                # Django management script
│   └── requirements.txt         # Backend dependencies
│
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── api/                 # Axios configuration
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # Authentication context
│   │   ├── pages/               # Application pages
│   │   ├── routes/              # Route configuration
│   │   ├── services/            # API service functions
│   │   ├── App.jsx              # Root React component
│   │   ├── index.css            # Global styles
│   │   └── main.jsx             # Application entry point
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration
│   └── index.html               # Application entry point
│
├── Screenshots/                 # Project screenshots
│
├── .env.example                 # Sample environment variables
├── README.md                    # Main documentation
├── PROJECT_OVERVIEW.md          # Project objectives and architecture
├── INSTALLATION.md              # Installation guide
└── DEVELOPMENT_LOG.md           # Development progress
```

---

# 🗄 Database Design

The current database consists of the following models:

- User Profile
- Income
- Expense
- Budget
- Savings Goal
- Report
- Notification

These models form the foundation of the BudgetBuddy financial management system.

---

# 🔐 Authentication

Authentication is implemented using **JSON Web Tokens (JWT)**.

### Available Endpoints

| Method | Endpoint               | Description          |
| ------ | ---------------------- | -------------------- |
| POST   | `/api/users/register/` | Register User        |
| POST   | `/api/users/login/`    | User Login           |
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

Backend

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

Frontend

```
http://localhost:5173/
```

---

# 👨‍💻 Django Administration

Create a superuser:

```bash
python manage.py createsuperuser
```

Open:

```
http://127.0.0.1:8000/admin/
```

---

# 📷 Project Screenshots

The **Screenshots** directory contains important development milestones, including:

- Project Structure
- Requirements File
- Django Welcome Page
- Django Admin Login
- Django Admin Dashboard
- Registered Users
- Database Migrations
- React + Vite Setup

---

# 📊 Current Development Progress

## Completed

- Backend Project Setup
- React Frontend Setup
- PostgreSQL Configuration
- Database Design
- JWT Authentication
- User Registration
- User Login
- Django Admin Configuration
- Initial Database Migrations
- React–Django Integration

---

## Upcoming Development

- Protected Routes
- Logout Functionality
- Income Module
- Expense Module
- Budget Module
- Savings Goals
- Reports
- Notifications
- Dashboard UI
- Charts & Analytics

---

# 📚 Documentation

Additional documentation is available in:

- PROJECT_OVERVIEW.md
- INSTALLATION.md
- DEVELOPMENT_LOG.md

---

# 👩‍💻 Developer

**Akshata Lokhande**

B.Tech – Information Technology

Madhav Institute of Technology & Science (MITS), Gwalior

Developed as part of the **Infosys Springboard 7.0 Internship Program**

---

# 📄 License

This project is developed for educational and internship purposes.

---

⭐ **BudgetBuddy is actively being developed, with additional finance management modules and dashboard features planned in upcoming milestones.**
