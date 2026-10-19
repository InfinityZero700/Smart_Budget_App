# AI Budget App

An AI-assisted personal budgeting prototype built with **React**, **Node.js/Express**, **PostgreSQL**, and **Prisma**. It combines transaction tracking with daily spending estimates and optional AI-generated summaries.

## Features

- Account signup and login using hashed passwords and JWT authentication
- Add, view, and delete transactions
- Track spending totals by category and over the previous 30 days
- Estimate a daily *safe-to-spend* amount using historical spending, weekend adjustments, and exponential smoothing
- Optional OpenAI-powered summaries and spending alerts, with deterministic fallback when no API key is provided
- Responsive dashboard built with React and Tailwind CSS

> **Project status:** Prototype. The *safe-to-spend* estimate is a spending-history heuristic, **not** a complete cash-flow budget: it does not account for income, debts, or upcoming bills. Do not use it as financial advice.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Tailwind CSS |
| API | Express, Node.js |
| Database | PostgreSQL, Prisma ORM |
| Authentication | bcryptjs, JSON Web Tokens |
| AI summaries | OpenAI API (optional) |

## Local setup

**Requirements:** Node.js and npm; a running PostgreSQL database.

1. Clone the repository.
2. In `backend`, copy `.env.example` to `.env`. Set your real `DATABASE_URL`, generate a strong `JWT_SECRET`, and optionally supply an `OPENAI_API_KEY`. Never commit `.env`.
3. In a terminal, run:

   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

4. In a separate terminal, run:

   ```bash
   cd frontend
   npm install
   npm start
   ```

5. Open `http://localhost:3000`. The API defaults to `http://localhost:5000`.

To point the frontend at another API address, copy `frontend/.env.example` to `frontend/.env` and change `REACT_APP_API_URL`.

## Repository layout

```text
backend/
  prisma/             # Database schema and migrations
  src/
    middleware/       # Authentication
    routes/           # AI insights, authentication, transactions
  .env.example
  package.json
frontend/
  public/
  src/                # React dashboard, login and transaction views
  .env.example
  package.json
```
## Author & Contact

**Akshat Milan**
- **GitHub:** [@InfinityZero700](https://github.com/InfinityZero700)
- **Focus:** Applied Mathematics & Computer Science | Machine Learning & Full-Stack Systems
- **Portfolio / Projects:** [Smart Budget App](https://github.com/InfinityZero700/Smart_Budget_App)
## Privacy and security

No credential files, private keys, or installed dependencies are included in this GitHub package. Replace any credentials from previous local `.env` files if they may have been shared. Production deployment requires further security hardening, such as CORS restrictions, rate limits, and stronger input validation.

## Current limitations

- AI-generated insights require a valid OpenAI API key; basic spending summaries work without one.

## Background

Independent software project exploring the intersection of personal finance, data analysis, and AI-assisted user experiences.
