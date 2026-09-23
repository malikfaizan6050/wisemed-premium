# WiseMedBilling

A public healthcare revenue-cycle marketing site and the authenticated CRM that
the leads it captures are worked in. Next.js 16 (App Router), React 19,
TypeScript, Tailwind 4, Firebase Authentication and Firestore.

## Requirements

- Node.js 24.x (see `engines` in `package.json`)
- A Firebase project with Authentication and Firestore enabled
- A service account for that same project, for server-side Admin access

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill it in, see below
npm run dev
```

The dev server runs on http://localhost:3000.

Seed the three system roles and grant the first administrator:

```bash
node --env-file=.env.local scripts/bootstrap-crm-auth.mjs --email=you@example.com
```

Review that script before running it against an existing database: it
overwrites the system-role definitions and grants admin to the email given.

## Environment

`.env.local` is git-ignored. **Every variable in it must also be set in the
deployment platform**, because `NEXT_PUBLIC_*` values are inlined at build time
and a missing one yields `undefined` rather than an error — the feature just
silently stops working.

| Variable | Purpose |
| --- | --- |
| `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` | Server-side Admin access. Must be the same project as the client config below. |
| `NEXT_PUBLIC_FIREBASE_*` | Browser Firebase config (API key, auth domain, project id, app id, storage bucket, messaging sender id). |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, the sitemap and robots. Defaults to the preview domain. |
| `NEXT_PUBLIC_APP_URL` | Origin used in links inside CRM emails. Define it once — a duplicate key silently wins. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 on the consultation form. |
| `RESEND_API_KEY`, `CRM_EMAIL_FROM` | Outbound email. Absent, email is skipped and the lead is still saved. |
| `CRON_SECRET` | **Required** for the nightly overdue-lead sweep. Without it the scheduled run cannot authenticate and does not run. |
| `WISEMED_CRM_API_KEY` | Server-to-server lead ingestion only. Never a browser credential. |
| `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` | WhatsApp Business webhook. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Click-to-chat number. Falls back to the business number in `src/lib/contact.ts`. |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY` | AI assistant knowledge search. |
| `CRM_TEMPORARY_PASSWORD_TTL_HOURS` | Temporary-password lifetime, default 24, capped at 168. |

## Checks

```bash
npm run lint
npm run typecheck
npm test          # CRM auth regression tests, isolated mocks, no network
npm run build
```

## Layout

```
src/app/            Routes. api/ holds the route handlers, dashboard/ the CRM.
src/components/     Public site components and CRM/ for the authenticated UI.
src/services/       Business rules: users, roles, activities, analytics, intake.
src/repositories/   Firestore reads, transactions and batched writes.
src/lib/            Permissions, scoring, duplicate detection, SEO, validation.
firestore.rules     Deny-by-default; clients never write to CRM collections.
docs/               Role and permission reference, production auth runbook.
```

Authorization is resolved server-side on every protected request: the Firebase
token identifies the user, then `users/{uid}` and `roles/{roleId}` decide what
they may do. See `docs/role-permissions.md`. Tokens carry only `roleId`, never a
permission list, so permission changes take effect on the next request.

## Operations

- Deploys from `main`.
- `vercel.json` schedules the overdue-lead sweep on weekdays; it needs `CRON_SECRET`.
- One-off repairs, all requiring `system.migrate` and all offering a GET dry run:
  `/api/leads/normalize-stages`, `/api/leads/backfill-search-keys`, `/api/migrate`.
- Deleting a lead is a soft delete into `crm_leads_deleted`.

## Before launch

`docs/WiseMedBilling_Project_Briefing_and_Meeting_QA.docx` records what still
needs sign-off: security and HIPAA review, monitoring and alerting, backup and
retention policy, the final production domain, and confirmation of the public
contact details and the performance figures used in the marketing copy.
