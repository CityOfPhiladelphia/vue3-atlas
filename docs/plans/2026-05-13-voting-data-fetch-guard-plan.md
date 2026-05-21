# Voting Data-Fetch Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop `VotingStore.fillAllVotingData()` from running its four `fillX` helpers when there is no AIS data yet (i.e. cold load of `/voting`).

**Architecture:** Two-line guard at the top of `fillAllVotingData`, mirroring the pattern already in [CondosStore.fillCondoData:27-28](../../src/stores/CondosStore.js#L27-L28). The store owns its dependency on AIS data; the guard lives next to the dependency.

**Tech Stack:** Pinia store action (Vue 3, plain JS).

**Spec:** [docs/plans/2026-05-13-voting-data-fetch-guard-design.md](./2026-05-13-voting-data-fetch-guard-design.md)

---

## File Structure

- **Modify** `src/stores/VotingStore.js` — add a guard to `fillAllVotingData`. No other files changed.

No tests added. Atlas has no unit-test infrastructure (no `@vue/test-utils`, no Pinia testing rig). Existing tests are live-API integration only (`src/stores/DorStore.test.js`, etc.) and a guard for `if (!features) return` isn't meaningful to test that way. Manual browser verification is the right tool here, matching how `CondosStore`'s identical pattern was verified.

---

### Task 1: Add the address guard to `fillAllVotingData`

**Files:**
- Modify: `src/stores/VotingStore.js:18-24`

- [ ] **Step 1: Apply the edit**

Open `c:\Users\andy.rothwell\Projects\vue3-atlas\src\stores\VotingStore.js`. The current `fillAllVotingData` action (lines 18–24) is:

```js
    async fillAllVotingData() {
      this.fillDivisions();
      this.fillPollingPlaces();
      this.fillElectedOfficials();
      this.fillElectionSplit();
      // this.fillNextElection();
    },
```

Replace with:

```js
    async fillAllVotingData() {
      const GeocodeStore = useGeocodeStore();
      if (!GeocodeStore.aisData.features) return;
      this.fillDivisions();
      this.fillPollingPlaces();
      this.fillElectedOfficials();
      this.fillElectionSplit();
      // this.fillNextElection();
    },
```

The `useGeocodeStore` import already exists at line 4 of the file — no new import needed.

- [ ] **Step 2: Manual browser verification (Andy)**

Andy runs the dev server. Verify in a browser:

1. Load `atlas.phila.gov/voting` cold (clear console first) → confirm the console no longer shows the four `fillDivisions - await never resolved, failed to fetch data` / `fillPollingPlaces - …` / `fillElectedOfficials - …` / `fillElectionSplit - …` lines.
2. From `/voting`, search a real address in the search bar → routes to `/[address]/voting` → the polling place / divisions / elected officials / election split tables populate normally (regression check).
3. Direct-load `/[address]/voting` (a known good address) from a fresh tab → same data populates correctly.

If any of these fail, stop and report what you see.

- [ ] **Step 3: Commit**

```bash
git add src/stores/VotingStore.js
git commit -m "fix: skip voting data fetch when no address is loaded"
```

---

### Task 2: Update local handoff

**Files:**
- Modify: `.claude/handoff.md` (gitignored — local-only update, no commit)

- [ ] **Step 1: Refresh the handoff**

Update `c:\Users\andy.rothwell\Projects\vue3-atlas\.claude\handoff.md` to reflect the completed voting-data-fetch fix and current branch state (`fix/voting-data-fetch`, PR pending). The file is in `.gitignore` so it is NOT committed.

---

## Self-Review

**1. Spec coverage:**
- Spec's "Fix" section (two-line guard at top of `fillAllVotingData`) → Task 1 Step 1 ✓
- Spec's "Test plan" (three manual verification steps) → Task 1 Step 2 ✓
- Spec's "Out of scope" items (catch log rename, router-level guard, loading-flag reset) → no tasks for any of them ✓

**2. Placeholder scan:** No TBDs, no "handle edge cases", no "implement later". The code change is shown in full.

**3. Type consistency:** The composable returns nothing new; the guard touches one Pinia store action. No type or signature drift.
