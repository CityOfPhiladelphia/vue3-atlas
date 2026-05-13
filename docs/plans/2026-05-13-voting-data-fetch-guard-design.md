# Skip Voting Data Fetch Without an Address — Design

*Date: 2026-05-13*
*Branch: `fix/voting-data-fetch`*

## Problem

Loading `atlas.phila.gov/voting` cold (no address in URL) runs `VotingStore.fillAllVotingData()`, which calls four `fillX` functions in parallel. Each reads `GeocodeStore.aisData.features[0].geometry.coordinates` directly — with no AIS data, that throws on undefined, gets silently caught, and logs the misleading `"fillDivisions - await never resolved, failed to fetch data"` line (and three siblings). No HTTP calls happen, but the console fills with noise.

## Why only voting

The router's `/:addressOrTopic` route ([router/index.js:316](../../src/router/index.js#L316)) whitelists `['voting']` as the only single-segment URL treated as a topic. Everything else (`/property`, `/li`, etc.) gets routed through the search flow. So voting is the only topic that reaches `topicDataFetch` without an address.

## Fix

Add a two-line guard at the top of [VotingStore.fillAllVotingData](../../src/stores/VotingStore.js#L18):

```js
async fillAllVotingData() {
  const GeocodeStore = useGeocodeStore();
  if (!GeocodeStore.aisData.features) return;
  this.fillDivisions();
  this.fillPollingPlaces();
  this.fillElectedOfficials();
  this.fillElectionSplit();
},
```

This mirrors the established pattern in [CondosStore.fillCondoData:27-28](../../src/stores/CondosStore.js#L27-L28), which already guards itself the same way.

## Why this place

- The store owns its dependency on AIS data — guard belongs next to the dependency.
- Any future `fillX` added to `fillAllVotingData` is automatically protected.
- No router changes needed; `dataFetch` stays generic.

## Out of scope

- The four `fillX` functions' misleading `"await never resolved"` catch log. The catch fires on a TypeError, not a fetch rejection. Renaming it is a separate cleanup; with this guard the catches don't trigger anymore.
- A router-level guard for "no address but on a topic route." Only `voting` reaches this state today, so the per-store fix is sufficient.
- Resetting `loadingVotingData` for the bailed case. [TopicPanel.vue:55](../../src/components/TopicPanel.vue#L55) renders `VotingIntro` (not `Voting.vue`) when the route is a topic without an address, so the stuck `loadingVotingData = true` is never observed by users.

## Test plan

Manual browser verification:

1. Load `/voting` cold — console no longer shows the four `fillDivisions`/`fillPollingPlaces`/`fillElectedOfficials`/`fillElectionSplit` lines.
2. From there, search a real address → `/[address]/voting` — polling place tables populate normally (regression check).
3. Direct load of `/[address]/voting` — same regression check from a cold start.
