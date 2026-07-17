# 📋 Project Overview

# Project Title

**BudgetBuddy – Personal Budget Planning & Expense Management Platform**

---

# About the Project

BudgetBuddy is a full-stack personal finance management application developed as part of the **Infosys Springboard 7.0 Internship Program**.

The application enables users to efficiently manage their personal finances through a secure, responsive, and intuitive web interface.

Users can:

- Track income
- Track expenses
- Manage monthly budgets
- Monitor spending
- View financial summaries
- Manage their profile securely

The application follows a RESTful architecture using **Django REST Framework** for the backend and **React** for the frontend.

---

# Project Objectives

The primary objectives of BudgetBuddy are:

- Build a secure finance management application.
- Simplify day-to-day financial tracking.
- Provide meaningful financial insights.
- Implement secure JWT authentication.
- Develop scalable REST APIs.
- Build a responsive frontend.
- Apply clean architecture and reusable components.
- Follow modern full-stack development practices.

---

# Target Users

BudgetBuddy is designed for individuals who want to organize and monitor their personal finances efficiently.

---

# Core Modules

## Authentication

- Registration
- Login
- JWT Authentication
- Password Management

---

## User Profile

- Profile Management
- Profile Picture
- Username Management
- Password Change

---

## Expense Management

- CRUD Operations
- Search
- Filtering
- Sorting
- Time Period Filtering
- Pagination

---

## Income Management

- CRUD Operations
- Search
- Pagination

---

## Budget Management

- Monthly Budgets
- Budget Utilization
- Budget Progress Tracking

---

## Dashboard

Provides a financial overview including:

- Total Income
- Total Expenses
- Net Savings
- Budget Progress
- Spending by Category
- Recent Transactions
- Month & Year Navigation

---

## Planned Modules

- Savings Goals
- Reports
- Notifications
- Charts & Analytics

---

# Technology Stack

## Backend

- Python
- Django
- Django REST Framework
- Simple JWT
- PostgreSQL

---

## Frontend

- React
- Vite
- JavaScript
- Bootstrap
- Axios

---

## Development Tools

- Git
- GitHub
- VS Code
- Postman
- pgAdmin 4

---

# Project Architecture

The application follows a modular architecture.

Each major feature is implemented as an independent Django application.

```
Users
│
├── Authentication
├── Profile

Finance
│
├── Expenses
├── Income
├── Budgets
├── Dashboard

Future
│
├── Savings Goals
├── Reports
└── Notifications
```

The frontend communicates with the backend exclusively through REST APIs secured using JWT authentication.

Reusable components, shared services, and utility modules are used throughout the application to improve maintainability and consistency.

---

# Development Methodology

The project is being developed incrementally using milestone-based development.

### Milestone 1

Project setup, authentication, and backend foundation.

✅ Completed

### Milestone 2

Core finance management modules.

✅ Completed

### Milestone 3

Advanced finance features.

🚧 In Progress

### Milestone 4

Deployment, testing, optimization, and final documentation.

⏳ Pending
