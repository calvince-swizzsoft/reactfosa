# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Backend architecture

- The `Application.MainBoundedContext` AppService layer is the canonical
  business layer. API controllers must delegate business operations and
  queries to the relevant AppService interface; do not duplicate business
  rules in controllers or bypass AppServices with direct repository/database
  access.

## Design Language

Full reference (color specimens, component mockups, and the full drift audit): https://claude.ai/code/artifact/401e97aa-d48f-4b1d-802a-5d3b408eaca1

This is a codification of the *existing* UI, not a new design — match it when creating or editing any page or component. **There are two coexisting, actively-maintained visual systems in this codebase, not one** — which to use depends on where the page lives. Picking the wrong one is the single most common styling mistake here (it happened building `FOSA/TreasuryTransactions/FiscalCounts.jsx` — first built against the Administration pattern below, had to be rebuilt against the Operational one once compared to a live sibling page). When in doubt, open an actual sibling page in the same area and match it — don't guess from this doc alone.

### Which pattern for which area

| Area | Pattern | Reference pages |
|---|---|---|
| Front Office (`FOSA/TellerTransactions/`, `FOSA/TreasuryTransactions/`) | **Operational** | `SavingsReceiptsPayments.jsx`, `CashManagement.jsx`, `EndOfDay.jsx` |
| Messaging | **Operational** | `Messaging/TextAlerts/index.jsx` |
| Accounts (list pages) | **Operational**, full treatment (self-wrap card, header bar, `bg-gray-200` list wrapper) — see below, a 2026-08-11 correction of earlier guidance that wrongly treated a bare-`<div>` shortcut as an accepted alternate | `Accounts/CostCenters/index.jsx`, `Accounts/Commissions/index.jsx`, `Accounts/ChequeTypes/index.jsx`, `Accounts/Levies/index.jsx` |
| Administration | **Administration** (newer, narrower adoption — only 2 pages as of this writing) | `Administration/Workflow/index.jsx`, `Administration/Modules/index.jsx` |

If a new page's area isn't in this table, treat **Operational** as the default — it's the pattern the large majority of the app actually uses. Only reach for the Administration pattern when building directly alongside other Administration-pattern pages.

### Brand & color
- Brand color is **indigo**, applied directly via Tailwind classes — `bg-indigo-600 hover:bg-indigo-700` for primary actions, `bg-indigo-800`/`bg-indigo-900` for chrome (navbar, sidebars). The shadcn `--primary` token in `src/index.css` is unbranded gray and not wired to indigo — don't rely on the Button `default` variant for primary actions; override with the indigo classes above.
- Neutrals: **the Operational pattern uses `gray-*`** (`gray-700` dark bars, `gray-200`/`gray-100` fills, `gray-400`/`gray-500` muted text) — this is the actively-maintained majority convention, not legacy drift. **The Administration pattern uses `slate-*`** (`slate-100` backgrounds, `slate-200` borders, `slate-700`/`slate-800` text) — keep it scoped to Administration-pattern pages; don't mix the two within one page.
- Status colors, pattern `px-2 py-1 rounded text-xs font-semibold bg-{color}-100 text-{color}-600`, same in both patterns:
  - green — success / active / authorized
  - amber/yellow — pending / warning
  - blue — info / posted / registry
  - red — destructive / locked / rejected
  - gray — neutral / unknown fallback

### Typography
- No custom font is loaded — default system UI sans stack.
- Operational page title: `text-xl font-bold text-white` (sits inside the indigo header bar, not on the page background — see Layout below). Administration page title: `text-2xl font-semibold text-slate-800` (on the white card, no colored bar).
- Subtitle: `text-sm text-gray-500` (Operational) / `text-sm text-slate-500` (Administration).
- Section eyebrow: `text-xs font-semibold uppercase tracking-wider text-gray-400`.
- Operational list header cell (a `<span>` in a grid row, not a real `<th>`): `text-gray-100 font-semibold` on a `bg-gray-700` bar. Administration `<th>`: `text-sm font-semibold text-slate-700` on `bg-slate-50`. Body text in either: `text-sm text-gray-700` / `text-sm text-slate-700` respectively.

### Layout & elevation

**Operational** (default — Front Office, Messaging, most Accounts pages):
- Page shell: the page self-wraps, `bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative` — no separate full-page background wrapper (`Layout.jsx` already renders an ambient indigo-tinted circle-pattern background behind every route; don't paint over it with a page-level `bg-slate-100`/`min-h-screen` wrapper, that was the exact mistake in the FiscalCounts rebuild above).
- Header: `bg-indigo-800 px-6 py-3 rounded-2xl` bar directly inside the card, `flex justify-between items-center`, white `text-xl font-bold` title (with a leading icon) on the left, a primary action button on the right if the page has one.
- **Do not skip the self-wrap card for a new or edited list page, even if an existing sibling in the same folder does.** Earlier guidance here said some Accounts list pages skip the self-wrap card/header bar entirely (bare `<div>`, content sitting directly on `Layout`'s own background) and treated that as an acceptable alternate as long as it matched a sibling. It wasn't — it wasn't the pattern building sibling pages, it was several copies of the same shortcut none of them checked against a canonical Operational page. Confirmed by direct comparison: `Accounts/Commissions/index.jsx` was built bare-div to match `CostCenters/index.jsx`, but side-by-side with `Messaging/TextAlerts/index.jsx` (the actual reference) it was missing the header bar/icon/title, the `bg-gray-200` list wrapper, `shadow-lg`/`hover:shadow-xl` row treatment, and the column-matching skeleton loader. `CostCenters`, `ChequeTypes`, `Levies`, and `Commissions` were all migrated to the full treatment 2026-08-11. `Accounts/ChartOfAccounts/index.jsx` is the one remaining page still on the old bare-div shortcut — it is unmigrated legacy debt, not precedent to copy. When building a new list page, match a *canonical* reference page for the pattern (e.g. `TextAlerts`) — matching a same-folder sibling is not sufficient on its own, since that sibling may itself be an unmigrated outlier.
- Radius scale: `rounded-md` (buttons/inputs) → `rounded-lg` (list rows/pills, page card) → `rounded-2xl` (header bar inside the card, drawers, modals).
- Shadow scale: `shadow`/`shadow-lg` (row cards, hover state `shadow-xl`) → `shadow-2xl` (page card).

**Administration** (Administration area only):
- Page shell: `min-h-screen bg-slate-100 p-6 md:p-10` wrapping a `mx-auto max-w-{3xl..6xl} rounded-2xl bg-white p-8 shadow-xl` card — this one *does* paint its own full-page background, which is correct only because it's the established convention for this specific area.
- No colored header bar — plain title text at the top of the white card.
- Radius scale: `rounded-md` (buttons/inputs) → `rounded-lg` (list rows/pills) → `rounded-xl` (table/list containers) → `rounded-2xl` (cards, drawers, modals).
- Shadow scale: `shadow` (row cards) → `shadow-lg` (dropdown menus) → `shadow-xl` (page card, drawers).

### Components
- **Buttons**: `components/ui/button.jsx`, but override primary actions with `bg-indigo-600 hover:bg-indigo-700` rather than the `default` variant.
- **Drawers / side panels**: same in both patterns — slide over from the right, framer-motion spring (`stiffness: 300, damping: 30`), backdrop fades to `opacity: 0.4`, `rounded-2xl` panel, `bg-indigo-600` header inset by an 8px margin with white text and an `outline` "Close" button. If the drawer's fields can plausibly exceed the viewport (more than ~6-7 fields, or any conditional field group that adds more), split it into a `flex flex-col` panel with a `flex-1 overflow-y-auto` scrolling body and a `shrink-0` footer holding the submit button — never let the submit button live inside the same scrolling region as the fields, it will scroll out of view on shorter viewports (real bug, `SavingsReceiptsPayments.jsx`'s Cheque Deposit form).
- **Forms**: `Label`/`Input`/`Select` from `components/ui`, wrapped in a local `FieldGroup` component (`<Label className="text-sm font-semibold text-gray-700">` + children) — every Operational-pattern page redefines this small wrapper locally rather than sharing one. Checkboxes are a raw `<input type="checkbox" className="w-4 h-4 accent-indigo-600">`, not the `Checkbox` component. When a field needs explanatory guidance, keep it hidden by default to avoid clutter: place a compact info-icon button beside the label and reveal the guidance in a click/touch-friendly `Popover` (`components/ui/popover.jsx`). Give the trigger an explicit `aria-label`, preserve keyboard focus styling, and do not render persistent helper paragraphs beneath every input. Short validation errors may still appear inline when they are actionable and specific to the current value. `Accounts/SavingsProducts/FieldHelp.jsx` is the reference implementation.
- **Customer pickers**: customer datasets are large and must never be implemented as a static `Select`, an unpaged “load all” request, or client-side filtering over the first API page. Use the shared server-backed searchable picker in `Registry/Customers/Documents/CustomerLookupModal.jsx` (and its `searchCustomers` API helper) as the standard implementation. It must query the authenticated singular endpoint `api/registry/customer`, debounce typed searches, expose the supported customer search fields, paginate results, show loading/empty/error states, render individual and organisation names correctly, and return the selected customer object/ID to the owning form. A form must visibly retain the selected customer and prevent submission until one is selected. Reuse or generalize this implementation instead of creating another customer dropdown.
- **Feedback**: SweetAlert2 (`Swal.fire`) for success/error/info and destructive confirmations; destructive confirms use `confirmButtonColor: "#dc2626"`.
- **Lists — Operational pattern (default, use this unless matching an Administration-area sibling)**: not a `<table>`. A `bg-gray-200 p-4 rounded-sm` wrapper containing a `grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4` header row (plain `<span>` columns, not `<th>`), then a `space-y-2` stack of `bg-white rounded-lg shadow-lg border` row cards (each a `grid grid-cols-12` matching the header's column spans, `hover:shadow-xl transition-all`; wrap the row in a `<button>` instead of a `<div>` if it's clickable). Loading state: 2-3 `animate-pulse` skeleton rows (`bg-gray-50` rows of `bg-gray-200` bars matching the grid). Empty state: centered `NotFoundImage` (`/assets/scopefinding.png`, `mx-auto w-42`/`w-32`) with a `text-gray-400` caption below it. Pagination: the complete `Prev` / `Page N of M` / `Next` control group is horizontally centered beneath the list, using default `Button`s (no `variant="outline"`). Counts or supplementary paging text belong on their own centered line so they never push the controls to the right. This centered placement is the list-page convention; do not right-align pagination.
- **Lists — Administration pattern**: a native `<table>` with a `bg-slate-50` header and `divide-slate-200` borders (`Administration/Workflow`, `Administration/Modules`). Scoped to that area — don't default to this for a new page elsewhere just because it looks more modern; see the area table above.
- **Icons**: `react-icons` — `Fa*` (Font Awesome) by default; indigo for brand/file icons, amber for folder/area icons, gray/slate (match the page's pattern) for neutral chrome, red only on destructive actions.

### Known drift — don't propagate
- Dark mode tokens exist in `src/index.css` but nothing uses `dark:` anywhere — don't add dark-mode classes unless explicitly asked to build dark mode support.
- `components/ui/badge.jsx`, `drawer.jsx`, `sheet.jsx`, and `table.jsx` exist but are unused by feature pages in favor of hand-rolled equivalents — match the hand-rolled patterns described above for consistency with the rest of the app unless asked to consolidate onto the shared primitives.
- Don't treat the Administration pattern's `<table>`/`slate-*` choices as "the modern one to migrate everything to" — as of this writing it's the newer, less-adopted pattern (2 pages), not a direction the rest of the app has actually moved in. Follow the area table above instead of a general "tables are better" instinct.
