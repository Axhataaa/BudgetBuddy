# 💰 BudgetBuddy

A full-stack personal finance management application built using **Django REST Framework**, **React**, and **PostgreSQL** as part of the **Infosys Springboard 7.0 Internship Program**.

BudgetBuddy helps users manage their personal finances by tracking income, expenses, budgets, and savings while providing an interactive dashboard with financial insights.

---

# 🚀 Project Status

| Milestone                                            | Status         |
| ---------------------------------------------------- | -------------- |
| Milestone 1 – Project Setup & Authentication         | ✅ Completed   |
| Milestone 2 – Finance Management Modules             | ✅ Completed   |
| Milestone 3 – Reports, Savings Goals & Notifications | 🚧 In Progress |
| Milestone 4 – Deployment & Final Testing             | ⏳ Pending     |

---

# ✨ Features

## 🔐 Authentication

- User Registration
- User Login
- JWT Authentication
- Refresh Token
- Logout
- Protected APIs
- Password Change
- User Profile

---

## 👤 Profile Management

- Profile Picture Upload
- Username Management
- Email
- Full Name
- Phone Number
- Bio
- Member Since
- User Role
- Change Password

---

## 💸 Expense Management

- Create Expense
- View Expenses
- Update Expense
- Delete Expense
- Expense Categories
- Search
- Category Filter
- Payment Method Filter
- Time Period Filter
- Custom Date Range
- Sorting
- Pagination

### Expense Categories

- Food
- Travel
- Shopping
- Education
- Entertainment
- Healthcare
- Bills
- Miscellaneous

---

## 💰 Income Management

- Complete CRUD
- Search
- Sorting
- Pagination

---

## 📊 Dashboard

Interactive dashboard including

- Total Income
- Total Expenses
- Net Savings
- Budget Progress
- Spending by Category
- Recent Transactions
- Month & Year Navigation

---

## 📁 Budget Management

- Monthly Budgets
- Budget Progress
- Budget Utilization
- Shared Period Selector

---

## 🎨 UI Features

- Responsive Bootstrap UI
- Indian Currency Formatting
- Shared Components
- Shared Period Selector
- Skeleton Loading States
- Toast Notifications
- Form Validation

---

# 🛠 Technology Stack

## Backend

- Python 3.13
- Django 6
- Django REST Framework
- Simple JWT
- PostgreSQL
- Pillow

## Frontend

- React 19
- Vite
- JavaScript
- Axios
- Bootstrap 5
- React Router DOM

## Development Tools

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
│   │   ├── assets/              # Images, icons, and static resources
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # Authentication and global context
│   │   ├── hooks/               # Custom React hooks
│   │   ├── layouts/             # Shared application layouts
│   │   ├── pages/               # Application pages
│   │   ├── routes/              # Route configuration
│   │   ├── services/            # API service functions
│   │   ├── styles/              # Global and custom styles
│   │   ├── utils/               # Utility/helper functions
│   │   ├── App.jsx              # Root React component
│   │   ├── App.css              # App-specific styles
│   │   ├── index.css            # Global styles
│   │   └── main.jsx             # React entry point
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

# 🗄 Database Models

The application currently contains the following database models.

## Users

- User
- Profile

## Finance

- Income
- Expense
- Budget

## Upcoming

- Savings Goal
- Report
- Notification

---

# 🔐 Authentication APIs

| Method    | Endpoint                         | Description     |
| --------- | -------------------------------- | --------------- |
| POST      | `/api/v1/users/register/`        | Register User   |
| POST      | `/api/v1/users/login/`           | Login           |
| POST      | `/api/v1/users/refresh/`         | Refresh Token   |
| POST      | `/api/v1/users/logout/`          | Logout          |
| GET/PATCH | `/api/v1/users/me/`              | Profile         |
| POST      | `/api/v1/users/change-password/` | Change Password |

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

# 👨‍💻 Django Administration

Create a superuser

```bash
python manage.py createsuperuser
```

Open

```
http://127.0.0.1:8000/admin/
```

---

# 📷 Screenshots

The `Screenshots` directory contains development screenshots including

- Authentication
- Dashboard
- Expenses
- Income
- Budgets
- Profile
- API Testing
- Database Migrations

---

# 📚 Documentation

Project documentation is organized into milestone-based reports.

- README.md
- PROJECT_OVERVIEW.md
- INSTALLATION.md
- DEVELOPMENT_LOG.md
- MILESTONE_1_COMPLETION.md
- MILESTONE_2_COMPLETION.md
- MILESTONE_3_COMPLETION.md
- MILESTONE_4_COMPLETION.md

---

# 📌 Roadmap

### ✅ Completed

- Authentication
- Expense Management
- Income Management
- Budget Management
- Dashboard
- Profile Management
- Filtering
- Sorting
- Pagination
- Indian Currency Formatting

### 🚧 In Progress

- Savings Goals
- Reports
- Notifications

### ⏳ Planned

- Charts & Analytics
- Export Reports
- Production Deployment
- Automated Testing

---

# 👩‍💻 Developer

**Akshata Lokhande**

B.Tech – Information Technology

Madhav Institute of Technology & Science (MITS), Gwalior

Developed as part of the **Infosys Springboard 7.0 Internship Program**

---

# 📄 License

This project is intended for educational and internship purposes.

---

⭐ **BudgetBuddy is actively evolving into a complete personal finance management platform with advanced analytics, reporting, and savings management features.**
