# Accessibility Brainstorm: vue3-atlas

_Date: 2026-02-09_
_Status: Brainstorm — no decisions finalized, no implementation started_

## Legal Context

- ADA Title II final rule (April 2024) requires state/local government web content to conform to **WCAG 2.1 Level AA**
- Compliance deadline: **April 24, 2026**
- Philadelphia has an existing accessibility policy and is working toward compliance

## Architecture Context

vue3-atlas uses MapLibre GL directly — it does NOT use @phila/phila-ui-map-core (that's phila-ui-4, used by newer apps like openmaps). Atlas depends on older vendor components from phila-ui-3:

- `@phila/phila-ui-app-header`
- `@phila/phila-ui-app-footer`
- `@phila/phila-ui-core`
- `@phila/phila-ui-callout`
- `@phila/phila-ui-dropdown`
- `@phila/phila-ui-lang-selector`
- `@phila/phila-ui-mobile-nav`
- `@phila/phila-ui-nav-link`
- `@phila/phila-ui-textbox`

## What Atlas Is

A geospatial data lookup tool — user enters an address, app displays property/civic data in a two-panel layout (topic panels on left, map on right). Two variants: Atlas (property assessments, condos, deeds, licenses, zoning, voting, city services, nearby activity) and CityAtlas (311, stormwater, districts).

49 Vue components total. Significantly more complex than pinboard.

## Why Atlas Is Better Positioned Than Pinboard

The map is secondary in atlas — the real value is the **data in the topic panels** (property details, zoning, voting, city services). This information is already presented as text and tables, not just map markers. A screen reader user could get most of the data they need from the topic panels after entering an address. The map provides spatial context but isn't the sole way to access the information.

## What Atlas Already Has

- Skip-to-main-content link in App.vue
- ImageryDropdownControl has `aria-haspopup`, `aria-controls`, `role="menu"`, and `aria-hidden="true"` on icons — best a11y component across all projects
- Pagination input has `aria-describedby` and `aria-controls`
- Map canvas has `tabindex="-1"` (prevents keyboard focus trap)
- Address search has proper label/input association with `for`/`id`
- Enter key handler on address search
- Toggle buttons have `tabindex="0"` and `title` attributes

## Scope: Atlas-Only vs Blocked on phila-ui-3

### In scope — changes within atlas's own code

#### Semantic Structure & Landmarks
- Add landmark regions: `<aside>` for topic panel, `<section>` for map area
- Add `aria-label` to landmarks so screen readers can differentiate them
- Topic panels could benefit from `<nav>` for the topic list/headers

#### Map Container (Map.vue)
- Add `role="img"` with `aria-label` (e.g., "Map showing property location and surrounding area")
- MapLibre keyboard interactivity stays enabled for sighted keyboard users

#### Topic Panels (Topic.vue, all topic components)
- Topic headers expand/collapse — need `aria-expanded` on trigger
- Need `aria-controls` linking header to content
- Consider `role="region"` with `aria-label` on each topic section

#### Map Control Buttons (Labels, Parcels, Cyclomedia, Eagleview toggles)
- Add `aria-pressed` to indicate toggle state
- Add `aria-label` where `title` alone is insufficient

#### Cyclomedia and Eagleview Panels
- Hide from assistive technology (`aria-hidden="true"`) — purely visual tools
- Hide activation buttons from assistive tech as well

#### Full-Screen Toggle Buttons
- Have `tabindex="0"` and `title` already — need `aria-expanded` or `aria-pressed` to indicate state
- Need `aria-label` for screen readers

#### Data Tables (VerticalTable, vue-good-table usage)
- Verify tables have proper `<caption>` or `aria-label`
- Verify column headers use `<th>` with `scope`
- Pagination already has good ARIA — verify it works end-to-end

#### Address Search (AddressSearchControl)
- Has label association already — verify sr-only positioning works across screen readers
- Clear button needs `aria-label` (not just visual icon)
- Consider `aria-live` announcement when search completes with results

#### TextFilter inputs
- Need associated labels
- Need `aria-label` or visible label

#### Icons Throughout
- All decorative Font Awesome icons need `aria-hidden="true"` (ImageryDropdownControl already does this — replicate the pattern)
- Icons that convey meaning need `aria-label` or associated text

#### Focus Management
- Visible `:focus-visible` styles on all interactive elements
- When topic panels expand, manage focus appropriately
- When Cyclomedia/Eagleview panels open/close, manage focus

#### Dynamic Content
- `aria-live="polite"` on topic panel content area — announce when data loads after address search
- `aria-busy` on loading states
- Error states (address not found) should use `role="alert"`

#### OpacitySlider
- Needs `aria-label` (e.g., "Overlay opacity")
- Needs `aria-valuemin`, `aria-valuemax`, `aria-valuenow` if custom slider (vs native `<input type="range">`)

### Blocked on phila-ui-3 — needs team decision

Same situation as vue3-pinboard. These components come from phila-ui-3:

- `@phila/phila-ui-app-header` — accessibility state unknown, probably passable
- `@phila/phila-ui-app-footer` — accessibility state unknown, probably passable
- `@phila/phila-ui-dropdown` — needs audit (atlas's own ImageryDropdownControl is accessible, but the vendor dropdown may not be)
- `@phila/phila-ui-lang-selector` — needs audit, language selection is important for accessibility
- `@phila/phila-ui-mobile-nav` — needs audit, navigation accessibility is critical
- `@phila/phila-ui-textbox` — needs audit
- `@phila/phila-ui-callout` — needs audit
- `@phila/phila-ui-nav-link` — likely fine (just renders links)

Atlas uses more phila-ui-3 components than pinboard (9 vs 4), so the blocked surface area is larger.

#### Decision needed from team (same options as pinboard):
1. **Fix in phila-ui-3** — invest in old code
2. **Work around in atlas** — wrap vendor components with ARIA at the app level
3. **Replace in atlas** — swap vendor components for accessible inline implementations
4. **Accept the gap** — document it and address in future rewrites

## Open Questions

- **Cyclomedia/Eagleview**: Hide entirely from assistive tech? (Consistent with map-core brainstorm decision)
- **Touch targets**: Map control buttons and toggle tabs may be below 44x44px minimum for mobile
- **Color contrast**: Toggle button active/inactive states, section colors — needs testing
- **DistanceMeasureControl**: Complex drawing tool — low priority for accessibility, but should at minimum not trap keyboard users

## Cross-References

- vue3-pinboard accessibility brainstorm: `vue3-pinboard/docs/plans/2026-02-09-accessibility-brainstorm.md`
- map-core accessibility brainstorm: `phila-ui-4/packages/map-core/docs/plans/2026-02-09-accessibility-brainstorm.md`
- The phila-ui-3 vendor component decision affects both atlas and pinboard — should be made together
