# Security and privacy model

## Threat model

Primary risks are credential stuffing, session theft, cross-site request forgery, stored XSS through profile/care fields, horizontal privilege escalation, staff-role escalation, overlapping sitter assignment, token leakage, excessive collection of child data, and accidental publication of internal files.

Controls in the MVP:

- Passwords use versioned PBKDF2-HMAC-SHA-256 with a random 128-bit salt and 600,000 iterations. Plaintext passwords are never stored or logged.
- Sessions use 256-bit opaque tokens. Only SHA-256 digests are stored in D1. Production cookies use the `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Lax` and a bounded lifetime.
- Password reset, suspension and deletion increment `session_version` and revoke active sessions.
- Mutating authenticated requests require a double-submit CSRF token whose digest is bound to the server session.
- Login, registration and reset initiation have persistent fixed-window throttles. Login failures are generic and accounts receive a temporary lock after repeated failures.
- Zod validates request shape and length. D1 prepared statements bind every variable. Browser rendering uses `textContent` for database values.
- CSP, frame protection, content-type protection, restrictive permissions policy and `no-store` API responses are set by the Worker.
- Server-side role and ownership checks protect every private action. Families/sitters cannot self-assign privileged roles.
- Booking and sitter state machines reject undocumented transitions.
- D1 triggers enforce non-overlapping confirmed/in-progress sitter assignments.
- Audit records capture actor, action, entity, timestamp, limited metadata and a one-way IP digest.
- Static asset exclusions block source, migrations, documentation, environment files, credentials, internal legal drafts and sensitive file patterns from publication.

## Data minimization

Children use a nickname, birth year and essential care notes; exact dates of birth are not requested. Sitter images are limited to eight internally controlled wildlife avatars. The platform has no upload endpoint for identity documents, background checks, photographs or medical files. Verification records store status and limited staff notes, not document scans.

Exact addresses are private family records and are not returned by matching. Public sitter data is separated from internal screening/notes. Notification rows should be retained only as long as operationally required.

## Deletion and retention

A user can submit a deletion request. Administrator completion revokes sessions/tokens, removes profile, child and saved-location data, clears booking free text and replaces the login email with a non-routable pseudonym. Minimal booking/audit identifiers remain for operational, dispute and legal retention. Retention periods and lawful bases must be approved in the final privacy policy before launch.

## Secrets and first administrator

Set secrets with Wrangler, never in Git:

```powershell
npx wrangler secret put BOOTSTRAP_SECRET
```

After applying the production migration, call `POST /api/auth/bootstrap-admin` once with `X-Bootstrap-Secret`. The endpoint becomes unavailable after the first administrator exists. Rotate or delete the bootstrap secret afterward.

## Remaining production controls

- Select and configure an email provider; add a scheduled outbox dispatcher and delivery observability.
- Review legal bases, retention periods, privacy/terms drafts and incident escalation procedure with qualified counsel.
- Add Cloudflare WAF/rate-limiting rules as a perimeter layer; application controls remain in place.
- Establish database backup/restore testing, access reviews and audit-retention policy.
- Run an external penetration test before handling real family/child data.
