# SASRA reporting categories

The existing SASRA Reports module opens a category page with two sections:

- `/Reports/GenerateSasraForm/DT`: existing Forms 1–7, their saved mappings, previews and exports.
- `/Reports/GenerateSasraForm/NWDT`: reserved for Form 2 reports. No NWDT preview/export is implemented yet. Any previously saved NWDT definitions remain readable here.

The legacy `/Reports/GenerateSasraForm/Setup` URL redirects to DT. Report lists filter by the saved `profile`; navigating between categories does not alter an institution profile or any mappings. Both pages inherit the existing SASRA module grant (26016). These are sections inside that module, not additional sidebar grants, and need no database migration.
