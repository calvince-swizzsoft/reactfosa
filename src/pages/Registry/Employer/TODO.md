# Registry/Employer module — remaining work

First pass covers employer list/create/edit/delete plus bulk division sync,
against `EmployerController` at `/api/registry/employer`. Not yet done:

- **`GET ""` / `GET "{id}"`** were not explicitly given in the spec — built on
  the assumption they mirror Zone/Division's paged-list + get-by-id shape.
  If the real routes differ, the list page and edit-prefill will break;
  confirm against the actual controller.
- **`moduleRouteMap.js` entry / sidebar wiring** — needs a real backend
  module `Code`, not available yet (same gap as `Registry/Customers`,
  `Registry/Zone`, `Registry/Division`).
- Division-name-only create flow (`Divisions: ["Nairobi Region", ...]`) vs.
  edit-mode bulk sync (`PUT {id}/divisions` with full `{Id, EmployerId,
  Description}` objects) use two different shapes for what's conceptually
  the same tab — this mirrors the API as specified, but worth double
  checking the create-time response (`data.divisions`) actually gets used
  anywhere once IDs are known, e.g. if the user immediately wants to edit
  divisions right after creating the employer.
- No "view this employer's zones/stations" rollup — only divisions are
  shown. Could add read-only nested detail later if needed.
