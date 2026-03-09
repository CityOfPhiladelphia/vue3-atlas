# Condo Unit Search Bar Design

*Date: 2026-03-09*
*Status: Approved*

## Problem

Large condo buildings (e.g. 2401 Pennsylvania Ave with 790 units across 79 pages) require users to paginate through many pages to find a specific unit. There's no way to jump to a unit directly.

## Approach: Fetch-All + Client-Side Filter

AIS does not support partial unit matching — partial queries return the base address as a fallback, not matching units. Since partial matching is required, filtering must happen client-side, which requires all data to be fetched.

## Behavior

- A text input labeled "Search by unit" sits between the "Condominiums (X)" heading and the table
- User types a partial or full unit number and presses Enter to submit
- On submit: fetch all unfetched API pages (cached pages are reused), then filter all features where `unit_num` contains the search string (case-insensitive substring match)
- Table is replaced with filtered results — no pagination, just a flat list
- A "Clear search" button appears to restore the original paginated view
- Empty search string is a no-op or clears any active filter

## Data Flow

1. User submits search term
2. CondosStore fetches all remaining pages (skipping already-cached ones)
3. All features are merged and filtered by `unit_num` substring match
4. Filtered results displayed in the same table format (Address, OPA Account #)
5. "Clear search" resets to normal paginated view at the last active page

## Edge Cases

- **No matches:** Show "No units matching '{term}'" message
- **Loading state:** Show spinner while fetching remaining pages
- **Small buildings (<=10 units):** Search bar still appears for consistency
- **Base address in results:** Has no `unit_num`, so it won't match any search (correct behavior)

## Decisions Made

- Search by unit number, not OPA account (OPA is already searchable via main search bar)
- Enter to submit, not live filtering (avoids unnecessary API calls)
- Substring match, not prefix (handles unusual unit numbering schemes)
- Fetch all pages on first search (worst case ~2401 Pennsylvania takes a few seconds; pages stay cached for subsequent searches)
