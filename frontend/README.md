# BudgetBuddy Frontend

This directory contains the **React + Vite** frontend for BudgetBuddy, a personal budget planning and expense management platform.

## Stack

- React
- Vite

**Live Application:** https://budget-buddy-ivory-mu.vercel.app

- React Router
- Axios
- Bootstrap
- Recharts
- Vitest
- Testing Library

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run the frontend tests:

```bash
npm run test
```

The current verified frontend test result is **47/50 passing**. Three Login tests currently fail because the password selector also matches the "Show password" button's `aria-label`; this is a test-selector issue rather than a reported Login functionality failure.

## Production

The Vite frontend has a verified production build and is deployed through the project's configured frontend hosting setup. `vercel.json` contains the frontend deployment configuration.

The frontend communicates with the deployed Django REST Framework backend through the configured API base URL.

## Main Features

- Authentication and protected routes
- Dashboard and analytics
- Income and expense management
- Budgets and savings goals
- Reports and exports
- AI Financial Analysis
- Notifications
- Profile and settings
- Theme and currency preferences
