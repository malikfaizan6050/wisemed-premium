# CRM production authentication

Firebase browser sign-in and CRM authorization are separate. The browser previously used hardcoded Firebase configuration; Admin used environment variables. A project mismatch, missing server credentials, or missing/invalid Firestore profile all led to the same login message. Admin also initialized at import time, outside route error handling. Escaped newline handling already existed; this fix additionally handles quoted PEM and CRLF and makes initialization lazy.

The exact deployed failure cannot be established without the failing Vercel response/logs and affected Firebase UID. Local environment files do not establish what Vercel has configured. No production records were changed.

## Vercel Production environment

Set these from the intended Firebase project, then redeploy (public values are embedded at build time):

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY` (complete service-account PEM, real newlines or literal `\n`; server-only)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (must equal Admin project ID)
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (used by Firebase configuration; not required for email/password login)
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` (used by Firebase configuration; not required for email/password login)

Use the web app configuration and service account from that same project. The account needs Firebase Authentication access for revocation/disabled checks and access to the default Firestore database. This app looks in Firestore, not Supabase, for CRM profiles. Do not solve server IAM failures by opening client Firestore security rules.

Related CRM variables (not required for ordinary password login): `CRM_TEMPORARY_PASSWORD_TTL_HOURS` (default 24), `RESEND_API_KEY`, `CRM_EMAIL_FROM` (email delivery), `NEXT_PUBLIC_APP_URL` (production origin for links/integration), `WISEMED_CRM_API_KEY` (restricted lead-ingestion service, never a browser-login credential).

Other existing feature variables: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`. These do not drive `/api/users/me`.

Root `.env.local` is local-only and ignored by Git. `src/app/.env.local` is not a Next.js environment-file location. Existing hardcoded browser configuration was moved into the ignored root file for local builds; no credential values were added to tracked files.

## Required datastore records

In the Admin project's default Firestore database, `users/<Firebase Authentication UID>` must exist. An email-keyed document or Firebase Authentication account alone is insufficient. It needs `status: "active"` (or the supported invitation flow), and a `roleId` referencing `roles/<roleId>`. Legacy `role` is supported. Missing profiles are never automatically granted access.

The role must be active and have a `permissions` array with recognized values from `src/lib/permissions.ts`. Existing admin permission semantics are preserved. Use the CRM administrator workflow to provision ordinary users and assign the intended role. Only repair the affected record if the returned code indicates a record problem; do not overwrite roles or promote every user to admin.

The existing `scripts/bootstrap-crm-auth.mjs` can initialize system roles and assign an initial administrator, but it overwrites system-role definitions and explicitly grants admin to the supplied email. Review it before using it on an existing database.

For temporary-password accounts, keep `mustChangePassword: true` and a valid future Firestore timestamp in `temporaryPasswordExpiresAt`; use the administrator regeneration flow if expired. Do not clear the flag to bypass password setup.

## Diagnosis after redeployment

Inspect the JSON `code` from `/api/users/me` and filter Vercel runtime logs for `[CRM auth]`. Logs contain fixed `stage`, `status`, and `code` labels only, not tokens, credentials, or user documents.

| Code | Meaning |
| --- | --- |
| `auth_token_missing` / `auth_token_invalid` | Missing, malformed, expired, revoked, or invalid session (401) |
| `firebase_admin_configuration_error` | Missing/malformed Admin settings, project mismatch, or recognized credential failure (503) |
| `crm_user_not_found` | No Firestore document at the verified UID (404) |
| `crm_user_inactive` | Disabled Firebase account or inactive CRM profile (403) |
| `crm_role_invalid` / `crm_role_inactive` / `crm_permissions_missing` | Invalid, disabled, or unconfigured role (403) |
| `crm_datastore_access_denied` | Server datastore IAM/authentication failure (503) |
| `temporary_password_expired` | Administrator must regenerate temporary password (403) |
| `password_change_required` | Continue to `/change-password` (428) |
| `internal_server_error` | Unexpected server/dependency failure; log stage identifies the operation (500) |

`requirePermission` also returns `forbidden` (403) for a valid user lacking a requested permission. `/api/users/me` accepts Firebase bearer identity only. Existing service authentication remains restricted to other authorized API paths.

## Validation

Run `node scripts/test-crm-auth.cjs`, `npm run typecheck`, and `npm run build` (`npm.cmd` on Windows with blocked PowerShell scripts). Tests use isolated mocks and no secrets/network; they do not establish production connectivity. After deployment, verify a real active user reaches the dashboard and that an invited temporary-password user reaches password setup.
