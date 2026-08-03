# Registry/Zone module — remaining work

First pass covers zone list/create/edit/delete plus zone-scoped station
management (view/add/remove stations belonging to the zone being edited),
against `ZoneController` at `/api/registry/zone`. Not yet done:

- **Standalone all-stations page** (`GET stations`, `GET stations/{id}`,
  `DELETE stations/{stationId}`) — station management is zone-scoped only
  for now, per explicit scoping decision.
- **`GET all`** (unpaged zones) — not wired up; nothing needs an unpaged
  zone dropdown yet.
- **`GET by-employer/{employerId}/stations`** / **`GET
  by-division/{divisionId}/stations`** — no current consumer.
- **Permanently deleting a single station** (`DELETE
  stations/{stationId}`) as a distinct action from "remove this station
  from the zone's list" (the Stations tab only does the latter, via the
  replace-array `PUT {id}/stations`).
- **`moduleRouteMap.js` entry / sidebar wiring** — needs a real backend
  module `Code` from Administration > Modules, not available yet (same gap
  as `Registry/Customers`).
- The zone create/edit drawer's Division select still comes from the older
  `VITE_APP_MEMBERSHIP_URL/api/administration/divisions` endpoint (no
  Division endpoints were part of this Zone API spec) — revisit if/when
  Division management also moves under `Registry`.
