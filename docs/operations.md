# Local and production operations

## Local setup

```powershell
npm install
npm run types
npm run db:migrate:local
npm run dev
```

Open the local URL printed by Wrangler, then visit `/portal/` or `/admin/`. D1 local data is stored under `.wrangler/state/` and is ignored by Git and static deployment.

## Verification

```powershell
npm run check
node check.js
npx wrangler d1 migrations list suncoast-sitters-db --local
```

The legacy `check.js` also validates content/business configuration and may report pre-existing launch blockers independently of the platform code.

## Production release

1. Confirm privacy/terms content and select notification providers.
2. Run `npm run check` and review `git diff --check`.
3. Run `npx wrangler deploy`. Wrangler's D1 automatic provisioning may create the database and write its identifier into the local configuration on first deploy; review the resulting diff.
4. Apply production migrations with `npx wrangler d1 migrations apply suncoast-sitters-db --remote`.
5. Set `BOOTSTRAP_SECRET`, create the first administrator once, then rotate/delete that secret.
6. Verify registration, email delivery, sign-in, permissions, matching, overlap rejection and deletion in the deployed environment before accepting live data.

Deployment is not considered verified from a successful local build alone. Record the Worker version, D1 migration state, public health response and browser checks for each release.
