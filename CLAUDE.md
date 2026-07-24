# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Design Language

Full reference (color specimens, component mockups, and the full drift audit): https://claude.ai/code/artifact/401e97aa-d48f-4b1d-802a-5d3b408eaca1

This is a codification of the *existing* UI, not a new design — match it when creating or editing any page or component.

### Brand & color
- Brand color is **indigo**, applied directly via Tailwind classes — `bg-indigo-600 hover:bg-indigo-700` for primary actions, `bg-indigo-800`/`bg-indigo-900` for chrome (navbar, sidebars). The shadcn `--primary` token in `src/index.css` is unbranded gray and not wired to indigo — don't rely on the Button `default` variant for primary actions; override with the indigo classes above.
- Neutrals: use **slate-*** (`slate-100` backgrounds, `slate-200` borders, `slate-700`/`slate-800` text) — not `gray-*`, which only survives in older FOSA Setup pages.
- Status colors, pattern `px-2 py-1 rounded text-xs font-semibold bg-{color}-100 text-{color}-600`:
  - green — success / active / authorized
  - amber/yellow — pending / warning
  - blue — info / posted / registry
  - red — destructive / locked / rejected
  - gray — neutral / unknown fallback

### Typography
- No custom font is loaded — default system UI sans stack.
- Page title: `text-2xl font-semibold text-slate-800`
- Subtitle: `text-sm text-slate-500`
- Section eyebrow: `text-xs font-semibold uppercase tracking-wider text-gray-400`
- Table header cell: `text-sm font-semibold text-slate-700`; body cell: `text-sm text-slate-700`

### Layout & elevation
- Page shell: `min-h-screen bg-slate-100 p-6 md:p-10` wrapping a `mx-auto max-w-{3xl..6xl} rounded-2xl bg-white p-8 shadow-xl` card.
- Radius scale: `rounded-md` (buttons/inputs) → `rounded-lg` (list rows/pills) → `rounded-xl` (table/list containers) → `rounded-2xl` (cards, drawers, modals).
- Shadow scale: `shadow` (row cards) → `shadow-lg` (dropdown menus) → `shadow-xl` (page card, drawers).

### Components
- **Buttons**: `components/ui/button.jsx`, but override primary actions with `bg-indigo-600 hover:bg-indigo-700` rather than the `default` variant.
- **Drawers / side panels**: slide over from the right, framer-motion spring (`stiffness: 300, damping: 30`), backdrop fades to `opacity: 0.4`, `rounded-2xl` panel, `bg-indigo-600` header inset by an 8px margin with white text and an `outline` "Close" button.
- **Forms**: `Label`/`Input`/`Select` from `components/ui`. Checkboxes are a raw `<input type="checkbox" className="w-4 h-4 accent-indigo-600">`, not the `Checkbox` component.
- **Feedback**: SweetAlert2 (`Swal.fire`) for success/error/info and destructive confirmations; destructive confirms use `confirmButtonColor: "#dc2626"`.
- **Tables/lists**: prefer a native `<table>` with a `bg-slate-50` header and `divide-slate-200` borders (the `Administration/Users` pattern) for new list pages.
- **Icons**: `react-icons` — `Fa*` (Font Awesome) by default; indigo for brand/file icons, amber for folder/area icons, slate for neutral chrome, red only on destructive actions.

### Known drift — don't propagate
- `gray-*` neutrals in some legacy pages — use `slate-*` in new code.
- Div/grid "row card" lists (e.g. `FOSA/Setup/Departments.jsx`) as an alternative to real tables — prefer the `<table>` pattern for new list pages.
- Dark mode tokens exist in `src/index.css` but nothing uses `dark:` anywhere — don't add dark-mode classes unless explicitly asked to build dark mode support.
- `components/ui/badge.jsx`, `drawer.jsx`, `sheet.jsx`, and `table.jsx` exist but are unused by feature pages in favor of hand-rolled equivalents — match the hand-rolled patterns described above for consistency with the rest of the app unless asked to consolidate onto the shared primitives.
