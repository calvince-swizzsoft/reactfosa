# Registry/Division module — remaining work

First pass covers division list/create/edit/delete against `DivisionController`
at `/api/registry/division`. Not yet done:

- **`GET all`** (unpaged divisions) — not wired up. Worth using instead of the
  Membership-area employers-style dropdown once other pages need a flat
  division picker.
- **`GET {id}/zones`** — no "view this division's zones" screen yet. Could
  live as a read-only list inside the edit drawer, similar to how
  `Registry/Zone`'s drawer shows a zone's stations.
- **`GET by-employer/{employerId}`** — no current consumer.
- **`moduleRouteMap.js` entry / sidebar wiring** — needs a real backend
  module `Code`, not available yet (same gap as `Registry/Customers` and
  `Registry/Zone`).
- The Employer select still comes from the older
  `VITE_APP_MEMBERSHIP_URL/api/administration/employers` endpoint — no
  Employer endpoints were part of this Division API spec.
- Delete warns that it cascades to zones/stations (per
  `IZoneAppService.RemoveDivisionAsync`), but there's no preview of what
  will actually be removed — consider surfacing the affected zone/station
  count before confirming, once `GET {id}/zones` is wired up.
