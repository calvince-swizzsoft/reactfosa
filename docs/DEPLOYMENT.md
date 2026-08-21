# Deployment

Deploying this frontend alongside the
[SwiftFinancialz](https://github.com/calvince-swizzsoft/Swift-Financials-FOSA)
backend onto a Windows Server, driven over RDP, as a plain IIS static site.

**For the full walkthrough — IIS setup, backend deployment, database
seeding, CORS wiring, troubleshooting, and the optional self-hosted runner —
see the backend repo's
[`docs/DEPLOYMENT.md`](https://github.com/calvince-swizzsoft/Swift-Financials-FOSA/blob/main/docs/DEPLOYMENT.md).**
The two apps are deployed together (one server, one CORS handshake between
them), so that doc covers both phase-by-phase. This page only covers the
frontend-specific build step.

## Production build

Vite bakes the API URL into the build **at compile time** — set it before
running `npm run build`, to wherever the backend will actually live once
deployed.

`.env.production` (gitignored — create locally, never commit real target
addresses/credentials):

```
VITE_APP_FIN_URL="http://YOUR-SERVER-ADDRESS:PORT"
VITE_APP_ADMIN_URL="http://YOUR-SERVER-ADDRESS:PORT"
VITE_APP_MEMBERSHIP_URL="http://YOUR-SERVER-ADDRESS:PORT"
# ...and the other VITE_APP_* keys already in .env — same value, all one backend
```

```
npm run build
# outputs to dist/ — already includes web.config for IIS SPA routing
```

`public/web.config` carries the IIS URL-Rewrite rule for client-side
routing, so it's copied into every `dist/` build automatically — nothing
extra to add by hand.

## Deploy

Copy `dist/*` to `C:\inetpub\wwwroot\fosa-app\` on the target server, then
follow Phase 05 onward in the backend repo's `docs/DEPLOYMENT.md` for the IIS
site setup, URL Rewrite confirmation, and CORS handshake with the backend.

If the backend's address changes after this build, update
`.env.production` and rebuild — then re-copy `dist/`.
