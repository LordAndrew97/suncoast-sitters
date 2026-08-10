# Suncoast Sitters platform architecture

## Decision record

The existing public, hash-routed website remains a static single-page application. The platform adds a Cloudflare Worker API under `/api/*`, a D1 relational database, a family/sitter portal at `/portal/`, and an operations console at `/admin/`. Static requests still use the existing Cloudflare Assets binding, so the original pages, content files and visual identity are not rebuilt or duplicated.

The API is the only authority for permissions and state changes. The browser hides irrelevant controls for usability, but every protected endpoint validates the server-side session, CSRF token, role, record ownership and allowed state transition.

## Runtime map

| Component | Responsibility |
| --- | --- |
| `index.html`, `assets/app.js` | Existing public site |
| `portal/`, `assets/private.js` | Family and sitter workflows |
| `admin/`, `assets/private.js` | Operations and administrator workflows |
| `src/index.ts` | Worker routes, authorization, validation and orchestration |
| `src/domain.ts` | Explicit booking/sitter state machines and deterministic ranking |
| `src/matching.ts` | Full-interval, timezone-aware availability and conflict filtering |
| `src/security.ts` | Password derivation, opaque sessions, CSRF and token primitives |
| `migrations/` | Versioned D1 schema and database-level overlap protection |

## Roles

- `family`: manages its own profile, children, locations, bookings and deletion request.
- `sitter`: manages its own profile/availability and responds to its own offers.
- `operations`: reviews sitters, coordinates bookings, calendar and incidents.
- `admin`: operations capabilities plus account suspension/reactivation and anonymization.

No role is inferred from a URL or request body. Public registration only permits `family` and `sitter`.

## Booking lifecycle

`draft → requested → matching → offered → confirmed → in_progress → completed`

Cancellation/expiry branches are defined in `src/domain.ts`. Invalid jumps are rejected with `409`. An accepted offer assigns the sitter and confirms the booking. D1 triggers reject any overlapping confirmed/in-progress assignment, including concurrent requests.

## Sitter lifecycle

`draft → submitted → under_review → approved`, with explicit rejection, revision and suspension paths. Only approved sitters enter matching.

## Matching order

Matching first applies hard filters: approved status, complete availability, no unavailable exception, no existing booking conflict, service area, and transport capability when required. Remaining candidates receive transparent points for current first aid, prior work with the family, vehicle and language options. Ties use display name and immutable user ID, making repeated runs deterministic.

## Notifications

Authentication events write provider-neutral messages to `notification_outbox`. The payload contains the one-time link needed by a future email/SMS sender. No production sender or credentials are embedded in the application. A scheduled dispatcher can later claim pending rows, call the selected provider and update `sent/failed` status without changing the authentication domain.

## Phase status

1. Architecture and threat model: implemented.
2. Worker, schema and migrations: implemented.
3. Authentication, sessions, RBAC and CSRF: implemented; delivery provider pending configuration.
4. Profiles, children and availability: implemented MVP.
5. Bookings, transitions, matching and overlap protection: implemented MVP.
6. Operations dashboard, calendar and incidents: implemented MVP.
7. Account deletion/anonymization and audit trail: implemented backend.
8. Responsive family, sitter and operations interfaces: implemented MVP.
9. Critical unit tests and local D1 checks: implemented.
10. Production migration, first-admin bootstrap and notification-provider setup: operational step, intentionally not executed by source changes.
