# SaaSFlow — User Management & Subscription System

A full-stack SaaS account-management demonstration built with React, Vite, Express, MongoDB/Mongoose, and JWT-backed sessions. It includes animated pages, account lifecycle endpoints, plan/feature restrictions, password reset, subscription expiry handling, and an admin dashboard.

> **Production status:** the source is deployable as a Vercel project after environment setup, but this is **not a complete production billing product yet**. Paid plan changes are simulated locally and are intentionally disabled in production unless `ALLOW_SIMULATED_BILLING=true`. A real payment provider and verified webhook flow must be integrated before charging customers or granting paid access in production. Password reset email delivery also requires Resend credentials.

## Features

- Signup, login, logout, current-user lookup, and rotating refresh sessions.
- Short-lived access tokens and refresh tokens stored in `HttpOnly`, `Secure` (production), `SameSite=Strict` cookies. Refresh tokens are stored hashed in MongoDB.
- Password reset links with hashed single-use tokens and a 30-minute expiry. In local development only, the API returns a reset link if email delivery is not configured.
- Profile update, password change, and account deletion APIs.
- Free, Starter, Professional, and Enterprise plans with server-side feature gates and expiry fallback to Free.
- Simulated billing ledger for local development. These entries are clearly labelled and are not counted as revenue.
- Admin APIs for user search/pagination, plan overrides, suspension/reactivation, deletion, and dashboard stats.
- Helmet headers, origin allowlisting, request validation, authentication rate limits, and generic production error responses.
- Vercel configuration for the Vite SPA and Express serverless API.

The sample feature endpoints (`/api/features/analytics`, `/api/features/api-access`, and `/api/features/custom-domain`) return demonstration payloads to prove the feature gates work. Replace these with real product services as the SaaS scope grows.

## Stack

- **Frontend:** React, Vite, React Router, Framer Motion, React Icons, React Hot Toast
- **Backend:** Node.js, Express, Mongoose, `jsonwebtoken`, `bcryptjs`
- **Database:** MongoDB locally or MongoDB Atlas in production
- **Deployment:** Vercel (frontend + serverless API in one project)

## Project structure

```text
User_Management/
├── api/index.js                  # Vercel serverless entrypoint
├── public/                       # Static public assets
├── server/
│   ├── config/db.js              # Cached MongoDB connection
│   ├── controllers/              # Authentication, user, subscription, admin logic
│   ├── middleware/               # Authentication, feature gates, validation
│   ├── models/User.js            # User and subscription model
│   ├── routes/                   # API routers
│   ├── utils/                    # JWT, pricing, email helpers
│   ├── app.js                    # Express app and security middleware
│   ├── seedAdmin.js              # Explicit admin account seeding
│   └── server.js                 # Local Node server bootstrap
├── src/                          # React frontend
├── tests/                        # Node built-in test suite
├── .env.example                 # Safe environment template
├── .gitignore
├── package.json
├── package-lock.json
├── vercel.json
└── vite.config.js
```

## API overview

### Authentication — `/api/auth`

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/register` | Create a Free-plan account |
| `POST` | `/login` | Create a browser session |
| `POST` | `/refresh` | Rotate the session cookies |
| `POST` | `/logout` | Revoke the refresh session |
| `GET` | `/me` | Get the signed-in user |
| `POST` | `/forgot-password` | Request a password-reset link |
| `POST` | `/reset-password/:token` | Consume a valid reset link |

### User — `/api/user`

`GET /profile`, `PUT /profile`, `PUT /change-password`, `DELETE /account` — all require authentication.

### Subscription — `/api/subscription`

`GET /plans` is public. Authenticated endpoints: `GET /`, `POST /upgrade`, `POST /downgrade`, `POST /cancel`, and `GET /billing`.

### Feature gates — `/api/features`

Authenticated feature-gated demonstration endpoints: `GET /analytics`, `GET /api-access`, and `GET /custom-domain`. An endpoint returns `403 FEATURE_RESTRICTED` if the current plan does not include that feature.

### Admin — `/api/admin`

All endpoints require an authenticated user with the `admin` role: `GET /stats`, `GET /users`, `GET /users/:id`, `PUT /users/:id/plan`, `PUT /users/:id/suspend`, `PUT /users/:id/reactivate`, and `DELETE /users/:id`.

## Run locally

### 1. Prerequisites

- Node.js 24.x (recommended; see `engines` in `package.json`)
- npm
- MongoDB running locally, or a MongoDB Atlas database

### 2. Environment setup

Copy `.env.example` to `.env`, then edit it. Generate two different random secrets with this command and paste the outputs into `JWT_SECRET` and `JWT_REFRESH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Set `MONGODB_URI` to your local database URI or Atlas connection string. Keep `.env` private; it is intentionally excluded from Git.

### 3. Install and start

```bash
npm ci
npm run dev
```

The Vite frontend runs on `http://localhost:5173`; Express runs on `http://localhost:5000`. The Vite development proxy sends `/api` requests to the local backend.

Build and test commands:

```bash
npm test
npm run build
npm run check
```

### 4. Seed an administrator

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your local `.env` first. The password must be at least 12 characters and contain uppercase, lowercase, and a number. Then run:

```bash
npm run seed:admin
```

The script does **not** ship a default administrator password and does not print your password. The seeded account receives the `admin` role and an Enterprise plan.

## Password-reset email

For local development, if `RESEND_API_KEY` and `EMAIL_FROM` are blank, `POST /api/auth/forgot-password` returns a development-only reset URL so you can test the complete UI flow.

For production, configure:

- `RESEND_API_KEY` — a Resend API key
- `EMAIL_FROM` — a verified sender address (for example, `SaaSFlow <security@your-domain.example>`)
- `FRONTEND_URL` — the exact public frontend origin used in reset links

The API intentionally returns an error in production if email delivery is not configured, rather than pretending that an email was sent.

## Deploy to Vercel

This project can be deployed as one Vercel project because `vercel.json` routes `/api/*` to the serverless Express handler and all other paths to the built Vite SPA. Vercel's Vite guidance notes that SPA deep links need a rewrite to `index.html`; this project includes one for routes such as `/reset-password/:token`.

1. Push the source to GitHub. Do **not** commit `.env`, `node_modules`, or `dist`.
2. Import the repository into Vercel with the project root set to the folder containing this `package.json`.
3. Create a MongoDB Atlas database and allow network access from your deployment environment. Use the Atlas connection string as `MONGODB_URI`.
4. Set these Vercel environment variables for **Production** (and Preview if desired):
   - `MONGODB_URI`
   - `JWT_SECRET` — a unique random secret, at least 32 characters
   - `JWT_REFRESH_SECRET` — a different unique random secret, at least 32 characters
   - `CLIENT_URL` — exact deployed origin, e.g. `https://your-app.vercel.app`
   - `FRONTEND_URL` — same deployed origin for reset links
   - `RESEND_API_KEY` and `EMAIL_FROM` for password reset email
   - `NODE_ENV=production` (Vercel usually sets this for Production builds)
5. Deploy. Verify `https://your-app.vercel.app/api/health`, then test registration, logout/login, reset email, profile, feature-gated endpoints, and admin actions.

**Do not set `ALLOW_SIMULATED_BILLING=true` in production** unless you deliberately want unpaid demo upgrades. Paid plan upgrades return `503 PAYMENTS_NOT_CONFIGURED` by default. Integrate a payment provider such as Stripe, validate signed webhooks server-side, and activate subscriptions only after confirmed payment before launching real subscriptions.

## Production hardening still required before serving real customers

- Integrate real payment checkout, signed webhook verification, refunds/cancellation handling, and idempotent payment events.
- Use a shared rate-limit store (such as Redis/Upstash); in-memory rate limits do not provide global enforcement across serverless instances.
- Add automated integration tests against a test MongoDB database and run end-to-end browser tests for signup/login/reset/admin workflows.
- Add monitoring/alerting, database backup/restore testing, privacy/terms pages, and an operational support process.
- Review plan-specific quotas against real project/team/storage services; the included feature-gate endpoints are demonstrators, not a complete SaaS product implementation.

## Security notes

- Never commit `.env` or production credentials. If the original ZIP's development secrets were ever pushed to a remote repository or reused elsewhere, rotate them.
- Never use the bundled application as a payment processor: current billing history entries are simulated unless future code marks an entry `paid` after verified provider confirmation.
- Admin access is not created automatically. Seed an admin explicitly using unique credentials stored privately.

## License

MIT
