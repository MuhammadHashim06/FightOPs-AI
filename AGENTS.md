<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# FightsAI Ops Structure Guide

- Keep all application code under `src/`.
- Put route groups in `src/app/(auth)` and `src/app/(dashboard)`.
- Keep public auth screens under `src/app/(auth)/auth/...`.
- Keep dashboard screens under `src/app/(dashboard)/dashboard/...`.
- Keep versioned API route handlers under `src/app/api/v1/...`.
- Put shared UI in `src/components/ui` and layout shells in `src/components/layout`.
- Put feature-specific UI and logic in `src/features/<feature-name>`.
- Put shared utilities and API response helpers in `src/lib`.
- Put server-only code in `src/server`.
- Put business logic in `src/server/services`.
- Put data access code in `src/server/repositories`.
- Put persistence-layer model shapes in `src/server/models`.
- Put validation schemas and request guards in `src/server/validators`.
- Put shared TypeScript types in `src/types`.
- Prefer adding new API endpoints under `/api/v1` unless a deliberate version bump is needed.
- Keep route handlers thin: parse input, call a service, return a standardized response helper.
- Do not place business logic directly inside pages, layouts, or route handlers.
- Use the design tokens from `src/app/globals.css` for colors, surfaces, borders, radii, and typography instead of hardcoded ad-hoc values.
- Prefer semantic utility classes backed by tokens such as `bg-app`, `bg-panel`, `bg-brand`, `text-text-body`, and `border-border-subtle`.
- Before changing Next.js structure or APIs, read the relevant docs in `node_modules/next/dist/docs/`.

# Backend Guide

- Use MongoDB through the shared connection in `src/server/db/mongoose.ts`.
- Define Mongo schemas and indexes in `src/server/models`.
- Keep database queries inside `src/server/repositories`; do not query Mongoose directly from route handlers or UI code.
- Keep orchestration and business rules inside `src/server/services`.
- Keep email sending inside `src/server/services/email.service.ts`.
- Keep auth flows inside dedicated auth service helpers instead of mixing token generation, email sending, and persistence inline everywhere.
- Validate request input before service logic runs. Put reusable validation in `src/server/validators`.
- Prefer small helper functions for repeated backend logic such as token creation, URL creation, email payload building, and date calculations.
- Return predictable service results and standardized API responses. Avoid ad-hoc response shapes.
- Use `src/types` for shared request, response, auth, and domain types.
- Prefer explicit names such as `registerUser`, `loginUser`, `sendPasswordReset`, and `verifyEmail`.
- Keep secrets and provider configuration in `.env` files only. Document every required variable in `.env.example`.
- For auth, default new signups to the `promoter` role unless a future admin-created flow explicitly sets another role.
- For password reset, assume the user reaches the reset screen from the email link instead of asking for manual token pasting in the UI.
- For email verification, treat verification as a follow-up step after sign-up or unverified login.
- When adding new backend files, favor one responsibility per file so code stays readable and easy to replace later.
