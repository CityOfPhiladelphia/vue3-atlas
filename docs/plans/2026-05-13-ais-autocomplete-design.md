# AIS Autocomplete in Atlas Search Bar — Design

*Date: 2026-05-13*
*Branch: `feat/ais-autocomplete`*

## Goal

Add an address-suggestion dropdown to atlas's search bar, matching the behavior already shipped in pinboard-3's OEM Flood Finder. As the user types ≥3 characters, suggestions from Philadelphia's AIS autocomplete service appear under the input. Selecting one fills the input and submits the search.

## Source

Two files in `pinboard-3/packages/ui` work as a self-contained pair with no app-specific dependencies:

- [useSearchSuggestions.ts](../../../pinboard-3/packages/ui/src/composables/useSearchSuggestions.ts) — fetches from `https://ais-autocomplete.citygeo.phila.city/autocomplete?q={query}`, returns `{ searchSuggestions, searchSuggestionsError, dismissSuggestions, hideSuggestions, refetchSuggestions }`.
- [SearchSuggestions.vue](../../../pinboard-3/packages/ui/src/components/SearchSuggestions.vue) — dropdown with keyboard navigation (↑/↓/Enter/Escape), emits `select` and `dismiss`.

Both are being copied into atlas, not consumed as a published package.

## Files added

- `src/composables/useSearchSuggestions.js` — JS port of the `.ts` composable. Drop type imports and annotations; logic identical.
- `src/components/SearchSuggestions.vue` — copy of the pinboard-3 component, with the `<style>` block rewritten to use atlas-appropriate values:
  - Background: white
  - Border: `1px solid #ccc`
  - Active/hover row: light grey background (`#f5f5f5`)
  - Font: inherit from parent
  - No design-system CSS variables — atlas doesn't have them.

## Wiring into [AddressSearchControl.vue](../../src/components/AddressSearchControl.vue)

1. Wrap the existing `.field.has-addons` row in a `position: relative` container so the absolutely-positioned dropdown anchors to its full width.
2. Render `<SearchSuggestions>` immediately after the field row, passing `searchSuggestions` from `useSearchSuggestions(toRef(MainStore, 'addressSearchValue'))`.
3. On `@select(suggestion)`:
   - `MainStore.addressSearchValue = suggestion`
   - `hideSuggestions()`
   - call the existing `replaceRoute()` — same code path as keyboard Enter.
4. On `@dismiss` (Escape or ArrowUp past top): `hideSuggestions()` and refocus the input.
5. Dismiss on outside click: attach a `mousedown` listener on `document` while suggestions are visible; clear suggestions when the click target is outside the search wrapper.

## Behavior

- `AddressSearchControl` is used in both the navbar and the `/search` page, so this change covers both surfaces in one place.
- AIS autocomplete returns 0 results for non-address inputs (OPA accounts, DOR numbers), so the dropdown silently does not render — the existing submit flow (`replaceRoute → GeocodeStore.fillAisData`) handles those unchanged.
- No debouncing beyond what the composable already does (which is none — fires on every input change). AIS autocomplete is built for keystroke traffic; matches pinboard-3's behavior. Can revisit if it shows up as a problem.

## Out of scope

- Refactoring atlas's existing AIS plumbing in [GeocodeStore.js](../../src/stores/GeocodeStore.js). The autocomplete service is a different endpoint (`ais-autocomplete.citygeo.phila.city`) than the submit-time AIS lookup (`api.phila.gov/ais/v1/search`); the two stay independent.
- Publishing the autocomplete code as a shared package across pinboard-3 and atlas. Two copies for now.
- Adding debouncing.

## Test plan

Manual, since atlas has no automated test setup for this UI:

1. Type "1234 mar" into the navbar search — see suggestions matching pinboard-3's screenshot ("1234 MARKET ST", "1234 MARLBOROUGH ST", etc.).
2. Click a suggestion → input fills with that address, search submits, atlas routes to the address view.
3. Type "1234 mar", press ↓↓ Enter → same result via keyboard.
4. Type "1234 mar", press Escape → dropdown closes, input retains text.
5. Type an OPA account or DOR number → no dropdown appears; pressing Enter still submits normally.
6. Type "12" (under 3 chars) → no dropdown.
7. Repeat steps 1 and 2 on the `/search` page (same component, different mount).
8. Click outside the search while the dropdown is open → dropdown closes.
