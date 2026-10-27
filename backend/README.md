# Bangladesh Digital Health & Emergency Platform

Backend foundation for the Bangladesh Digital Health & Emergency Platform.

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

## Initial Super Admin
Set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in the backend environment to create the first Super Admin automatically. The password is hashed and stored in MongoDB. Leave both variables empty to skip bootstrap.

## Current Scope
Authentication, administrator creation, RBAC, audit logging, and initial Super Admin provisioning are included.

## AI assistant diagnostics
The authenticated `/api/ai/chat` endpoint streams screened responses from the configured Gemini model. Backend logs include request-ID-correlated `ai_request_timing` and `gemini_timing` events; the frontend logs request-to-first-visible-text and total response time. These measurements contain durations and request IDs only, not chat text or user data.

The local Vite server runs on port 5173 and proxies `/api` to the backend at `http://localhost:5000/api` by default. The backend connects to MongoDB once during startup; chat requests do not read or write MongoDB. Configure `GEMINI_MODEL` and `GEMINI_API_KEY` in the backend environment. Provider model/credential failures are surfaced as `AI_MODEL_UNAVAILABLE` or `AI_PROVIDER_AUTH_FAILED`; generation requests time out after 30 seconds and are not automatically retried.
