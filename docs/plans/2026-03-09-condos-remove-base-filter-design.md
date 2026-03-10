# Remove Condo Base Address Filter

*Design approved: 2026-03-09*

## Problem

The `CondosStore.js` filter (lines 45-52) attempts to exclude the "base" property from the condominiums list. This causes problems for addresses like 53 E Logan St, where a related rear property (53R E Logan St) appears as a condo but the searched address itself is filtered out. The owner of 53 E Logan St doesn't appear in their own condo list.

## Investigation

Tested 58 known condo buildings against the AIS API (`/ais/v1/search/{address}?include_units=true&opa_only=true`):

- **44/58**: No base address in results at all. The filter is a no-op.
- **10/58**: Base address present. Of these, 7 have `total=1` (single property, not a real condo building), and 2 are real condo buildings (1420 Locust St, 202 W Rittenhouse Sq) where the base is a building entity with its own OPA account. 1 is the 53 E Logan case.
- **5/58**: Errored/404'd from AIS.

Decision: It's acceptable to show the base address alongside units. If it has an OPA account, it's a legitimate property entry.

## Changes

### 1. CondosStore.js — Remove the filter

Remove the loop that checks `address_low_frac` and `street_address` to exclude the base property. Remove the `total_size` decrement. Push all API response features directly into `newData.features`.

### 2. Condos.vue — Add disclaimer note

Add a note between the `<h2>Condominiums (X)</h2>` heading and the table, styled with the same `topic-info` class as the existing description text:

> Note: Occasionally, similar addresses may be listed here that are not part of a planned community. Refer to the deed and other legal documents for legal definitions, relationships, and obligations pertaining to any property.

## Impact

| Address | Before | After |
|---|---|---|
| 53 E Logan St | Shows only 53R (1 item) | Shows 53 E Logan + 53R (2 items) |
| 2930 Chestnut St | Shows only 2930L # B (1 item) | Shows 2930 Chestnut + 2930L # B (2 items) |
| 1420 Locust St | 569 units (base hidden) | 570 items (base included) |
| 202 W Rittenhouse Sq | 180 units (base hidden) | 181 items (base included) |
| All other condos (44 tested) | No change | No change |

## Future Work

Add a search bar above the condo table to let users find a specific unit without paginating through results. This is especially important for large buildings like 2401 Pennsylvania Ave (790 units). Separate task.
