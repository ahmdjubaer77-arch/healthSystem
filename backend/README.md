# Nirogix — Digital Healthcare Platform

Backend foundation for Nirogix, a digital healthcare platform.

## Stack
- Node.js
- Express.js
- MongoDB
- Mongoose
- JavaScript

## Scripts
- `npm install`
- `npm start`
- `npm run dev`

## Environment
Copy `.env.example` to `.env` and update the values if needed.

For Render, set `CLIENT_URL` to the exact Vercel frontend origin. If you use more than one
frontend domain, separate the origins with commas (for example, the production domain and
the current preview deployment domain). Set Vercel's `VITE_API_BASE_URL` to
`https://healthsystem-xe2t.onrender.com/api`.

To send user feedback to Gmail, set `GMAIL_USER` to the sending Gmail address,
`GMAIL_APP_PASSWORD` to a Google App Password, and `FEEDBACK_RECIPIENT` to the inbox that
should receive feedback. Keep these values in the backend environment only; do not add them
to the frontend environment or commit real credentials.

## Email OTP verification and password reset
Email OTP uses the backend-only `RESEND_API_KEY` and `EMAIL_FROM` variables and Resend's
HTTPS API; it does not use SMTP. Set `EMAIL_FROM` to an address on a verified Resend domain
or another sender authorized by your Resend account. Resend rejects unverified senders;
production email is not sent through Gmail as a fallback. Never put the API key in frontend
configuration or logs. Gmail variables remain available for the separate feedback email
flow. `JWT_SECRET` is used to HMAC-hash OTPs at rest. Codes expire after five minutes, are
limited to five verification attempts, and can be resent once per minute. OTPs are stored
in the `OneTimeCode` MongoDB collection with a TTL index.

The public auth endpoints are:
- `POST /api/auth/email/verification/request`
- `POST /api/auth/email/verification/confirm`
- `POST /api/auth/password/reset/request`
- `POST /api/auth/password/reset/verify`
- `POST /api/auth/password/reset/confirm`

Password reset requests always return the same generic response regardless of whether an
account exists. Reset authorization is a random, five-minute token returned only after OTP
verification and is kept in frontend memory between verification and password update.

## Initial Super Admin
Set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in the backend environment to create the first Super Admin automatically. The password is hashed and stored in MongoDB. Leave both variables empty to skip bootstrap.

## Current Scope
Authentication, administrator creation, RBAC, audit logging, and initial Super Admin provisioning are included.

## AI assistant diagnostics
The authenticated `/api/ai/chat` endpoint streams screened responses from the configured Gemini model. Backend logs include request-ID-correlated `ai_request_timing` and `gemini_timing` events; the frontend logs request-to-first-visible-text and total response time. These measurements contain durations and request IDs only, not chat text or user data.

The local Vite server runs on port 5173 and proxies `/api` to the backend at `http://localhost:5000/api` by default. The backend connects to MongoDB once during startup; chat requests do not read or write MongoDB. Configure `GEMINI_MODEL` and `GEMINI_API_KEY` in the backend environment. Provider model/credential failures are surfaced as `AI_MODEL_UNAVAILABLE` or `AI_PROVIDER_AUTH_FAILED`; generation requests time out after 30 seconds and are not automatically retried.
