# SkillForge

SkillForge is a local learning and problem-solving app. The frontend uses React and Vite. The API uses Node.js, Express, and PostgreSQL with direct SQL through `pg`.

## Features

- Account signup, login, logout, and protected profile and dashboard pages.
- Database-backed multiple-choice questions with category and difficulty filters.
- Answer submissions, explanations, and per-user progress statistics.
- Contest listing, details, registration, and an administrator form for creating scheduled contests.
- Administrator-only question creation, editing, and deletion.

## Project structure

```text
project/
├── src/                 React app
├── public/              Static frontend files
├── backend/
│   ├── src/             Express routes, controllers, config, and middleware
│   └── sql/             PostgreSQL schema and approved question seed
├── package.json         Frontend scripts and dependencies
└── README.md
```

## Requirements

- Node.js and npm
- PostgreSQL 18, with a database named `skillforge`

## Local configuration

Create `backend/.env` from `backend/.env.example` or edit the existing local file. Set the PostgreSQL connection values, a random `JWT_SECRET` of at least 32 characters, and `ADMIN_EMAIL` to the single administrator account email. The local `.env` file is ignored by Git; do not commit credentials.

The API loads `backend/.env` directly. Test the configured database connection from the backend directory:

```sh
npm run db
```

To prepare an empty database, apply the schema from the backend directory:

```sh
psql -d skillforge -f sql/schema.sql
```

The schema uses safe `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE` migrations. It does not drop tables or delete existing records.

## Seed the approved questions

`backend/sql/seed.sql` contains 24 multiple-choice questions: six each in Maths, Mental Maths, IQ & Logic, and Aptitude. Each category has two easy, two medium, and two hard questions. The script skips matching category/title pairs and can be run repeatedly.

From the backend directory:

```sh
psql -d skillforge -f sql/seed.sql
```

The seed runs only when explicitly executed; starting the server does not seed or change database records.

## Start locally

Run these in separate terminals.

Frontend, from the project root:

```sh
npm install
npm run dev
```

Backend, from `backend/`:

```sh
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173` and proxies `/api` requests to Express on `http://localhost:3000`. The health endpoint is `http://localhost:3000/api/health`.

Register using the Signup page, then log in. Passwords are normally 8–72 UTF-8 bytes. During non-production development only, the configured administrator can use the locally configured temporary setup password; the short-password exception is disabled when `NODE_ENV=production`. The administrator account is identified by the server-side `ADMIN_EMAIL` setting; signup request fields, local storage values, and client-side UI changes cannot grant administrator access. Never use a temporary development password in production.

## Pages

- `/` — Home
- `/signup` — Create an account
- `/login` — Sign in
- `/dashboard` — Personal learning summary
- `/profile` — Profile, password, and practice history
- `/problems` — Browse database questions
- `/problem/:id` — Answer a question
- `/contest` — View contests and register
- `/admin` — Administrator question and contest tools

## API endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | API health |
| POST | `/api/auth/signup` | Public | Register and receive a session |
| POST | `/api/auth/login` | Public | Sign in and receive a session |
| GET | `/api/users/me` | Signed in | Read the current profile and server-calculated admin status |
| PATCH | `/api/users/me` | Signed in | Update the current user's name |
| PATCH | `/api/users/me/password` | Signed in | Change password after checking the current password |
| GET | `/api/questions` | Public | List questions; accepts `category` and `difficulty` filters |
| GET | `/api/questions/:id` | Public | Read a question without its answer or explanation |
| GET | `/api/questions/admin` | Administrator | Read full question data for the management form |
| POST | `/api/questions` | Administrator | Create a question |
| PATCH | `/api/questions/:id` | Administrator | Edit a question |
| DELETE | `/api/questions/:id` | Administrator | Delete a question without existing submissions |
| POST | `/api/submissions` | Signed in | Submit an answer for the signed-in user |
| GET | `/api/submissions/mine` | Signed in | Read the current user's submissions |
| GET | `/api/progress/me` | Signed in | Read the current user's progress |
| GET | `/api/contests` | Public | List contests and registration counts |
| GET | `/api/contests/:id` | Public | Read contest details |
| GET | `/api/contests/mine` | Signed in | List the current user's registrations |
| POST | `/api/contests/:id/register` | Signed in | Register the current user once |
| POST | `/api/contests` | Administrator | Create a contest with supplied future dates |

## Checks

Frontend checks, from the project root:

```sh
npm run lint
npm run build
```

Backend connection and syntax checks, from `backend/`:

```sh
npm run db
find src -type f -name '*.js' -print0 | xargs -0 -n1 node --check
```
# ap_demo
