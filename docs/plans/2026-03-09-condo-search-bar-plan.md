# Condo Unit Search Bar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a search bar to the Condominiums topic that lets users find specific units by partial unit number without paginating.

**Architecture:** Add a `fetchAllPages` action to CondosStore that fetches all remaining uncached API pages. Add search state (`searchTerm`, `searchActive`) to CondosStore. In Condos.vue, add a text input + button above the table. When searching, compute filtered rows from all cached features using case-insensitive substring match on `unit_num`, and hide pagination.

**Tech Stack:** Vue 3 (Composition API), Pinia, axios, vue-good-table

**Design doc:** `docs/plans/2026-03-09-condo-search-bar-design.md`

---

### Task 1: Add `fetchAllPages` action to CondosStore

**Files:**
- Modify: `src/stores/CondosStore.js:20-63`

**Step 1: Add search state fields**

Add to the `state` return object (after `loadingCondosData: false` on line 18):

```js
searchTerm: '',
searchActive: false,
```

**Step 2: Add `fetchAllPages` action**

Add a new action after `fillCondoData` (after line 63, before the closing `}`):

```js
async fetchAllPages() {
  const GeocodeStore = useGeocodeStore();
  const address = GeocodeStore.aisData.features[0].properties.street_address;
  const totalPages = this.condosData.page_count;
  if (totalPages <= 1) return;
  this.loadingCondosData = true;
  for (let i = 2; i <= totalPages; i++) {
    if (!this.condosData.pages['page_' + i]) {
      await this.fillCondoData(address, i);
    }
  }
  this.loadingCondosData = false;
},
```

**Step 3: Add `submitSearch` action**

Add after `fetchAllPages`:

```js
async submitSearch(term) {
  if (!term.trim()) {
    this.clearSearch();
    return;
  }
  this.searchTerm = term.trim();
  await this.fetchAllPages();
  this.searchActive = true;
},

clearSearch() {
  this.searchTerm = '';
  this.searchActive = false;
},
```

**Step 4: Commit**

```bash
git add src/stores/CondosStore.js
git commit -m "Add search state and fetchAllPages/submitSearch actions to CondosStore"
```

---

### Task 2: Add search UI and filtering to Condos.vue

**Files:**
- Modify: `src/components/topics/Condos.vue:1-131`

**Step 1: Add search ref and handlers in `<script setup>`**

After the `onMounted` block (line 41), add:

```js
import { ref } from 'vue';

const searchInput = ref('');

const handleSearch = async () => {
  await CondosStore.submitSearch(searchInput.value);
};

const handleClear = () => {
  searchInput.value = '';
  CondosStore.clearSearch();
};
```

Note: `ref` must be added to the existing import on line 3: `import { computed, watch, onMounted, ref } from 'vue';`

**Step 2: Add filtered rows computed**

After the `condos` computed (line 50), add:

```js
const filteredCondos = computed(() => {
  if (!CondosStore.searchActive) return null;
  const term = CondosStore.searchTerm.toLowerCase();
  return condos.value.filter(f => {
    const unitNum = (f.properties.unit_num || '').toLowerCase();
    return unitNum.includes(term);
  });
});
```

**Step 3: Update `condosTableData` to use filtered rows when searching**

Change the `rows` line in `condosTableData` (line 65):

```js
// Before:
rows: condos.value || [],

// After:
rows: CondosStore.searchActive ? (filteredCondos.value || []) : (condos.value || []),
```

**Step 4: Add search bar HTML in template**

After the `<h2>` heading block (after line 92), add:

```html
<div class="condo-search">
  <form @submit.prevent="handleSearch" class="condo-search-form">
    <input
      v-model="searchInput"
      type="text"
      placeholder="Search by unit"
      class="condo-search-input"
    />
    <button type="submit" class="condo-search-button">Search</button>
  </form>
  <div v-if="CondosStore.searchActive" class="condo-search-active">
    <span v-if="filteredCondos && filteredCondos.length > 0">
      Showing {{ filteredCondos.length }} result{{ filteredCondos.length === 1 ? '' : 's' }} for "{{ CondosStore.searchTerm }}"
    </span>
    <span v-else>
      No units matching "{{ CondosStore.searchTerm }}"
    </span>
    <button type="button" class="condo-clear-button" @click="handleClear">Clear search</button>
  </div>
</div>
```

**Step 5: Disable pagination when search is active**

Update `paginationOptions` (line 14-29) — change the `enabled` line:

```js
// Before:
enabled: tableLength > 5,

// After:
enabled: !CondosStore.searchActive && tableLength > 5,
```

**Step 6: Add styles**

Add to the `<style scoped>` section (before the closing `</style>`):

```css
.condo-search {
  margin-bottom: 1rem;
}

.condo-search-form {
  display: flex;
  gap: 0.5rem;
}

.condo-search-input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 0.9rem;
}

.condo-search-button {
  padding: 0.4rem 1rem;
  background: #0f4d90;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9rem;
}

.condo-search-button:hover {
  background: #0a3661;
}

.condo-search-active {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.condo-clear-button {
  background: none;
  border: none;
  color: #0f4d90;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.9rem;
  padding: 0;
}
```

**Step 7: Commit**

```bash
git add src/components/topics/Condos.vue
git commit -m "Add condo unit search bar UI with client-side filtering"
```

---

### Task 3: Manual testing

**No code changes — verification only.**

Test these addresses in the browser (dev server should already be running):

1. **2401 PENNSYLVANIA** — Search "11", expect multiple floor-11 units. Search "11B30", expect 1 result. Clear search, confirm pagination restored.
2. **220 W WASHINGTON SQ** — Search a known unit partial. Clear and verify.
3. **53 E LOGAN ST** — Small building (2 condos). Search bar appears but searching a non-existent unit shows "No units matching" message.
4. **1234 MARKET ST** — No condos. Confirm search bar doesn't cause issues when there are 0 results.

**Step 1: Test each address and verify behavior**
**Step 2: Commit any fixes if needed**

---

### Task 4: Update handoff note

**Files:**
- Modify: `vue3-atlas/.claude/handoff.md`

**Step 1: Update handoff to reflect completed search bar work**
**Step 2: Commit**
