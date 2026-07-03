# ⚙️ Installation Guide

## Clone Repository

```bash
git clone <repository-url>
```

---

## Backend Setup

```bash
cd backend
```

Create virtual environment

```bash
python -m venv venv
```

Activate virtual environment

Windows

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Apply migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

Run server

```bash
python manage.py runserver
```

---

## Frontend Setup

```bash
cd frontend
```

Install packages

```bash
npm install
```

Run frontend

```bash
npm run dev
```

---

## URLs

Backend

```
http://127.0.0.1:8000/
```

Frontend

```
http://localhost:5173/
```

Admin

```
http://127.0.0.1:8000/admin/
```

## Environment Variables

Create a `.env` file in the backend directory using the provided `.env.example` as a reference.
