# AIS Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an address-suggestion dropdown to atlas's search bar that fetches from Philadelphia's AIS autocomplete service as the user types.

**Architecture:** Two new self-contained files (`useSearchSuggestions.js` composable and `SearchSuggestions.vue` dropdown) ported from `pinboard-3/packages/ui`, wired into the existing `AddressSearchControl.vue`. The composable fetches `https://ais-autocomplete.citygeo.phila.city/autocomplete?q={query}` on input changes ≥3 chars and exposes a reactive array of address strings. The dropdown renders the array, supports keyboard navigation, and emits `select`/`dismiss`. On select, the parent fills `MainStore.addressSearchValue` and calls the existing `replaceRoute()` — same submit path as keyboard Enter.

**Tech Stack:** Vue 3 (script setup), Pinia, vue-router, Bulma, Vitest (integration-style live-API tests, matching `src/stores/DorStore.test.js` pattern). No component testing framework — UI verification is manual.

**Spec:** [docs/plans/2026-05-13-ais-autocomplete-design.md](./2026-05-13-ais-autocomplete-design.md)

---

## File Structure

- **Create** `src/composables/useSearchSuggestions.js` — debounce-free composable wrapping AIS autocomplete fetch. Single responsibility: keep a `searchSuggestions` ref in sync with the input value via a watch.
- **Create** `src/composables/useSearchSuggestions.test.js` — live-API integration test (matches existing test style in `src/stores/`).
- **Create** `src/components/SearchSuggestions.vue` — presentational dropdown. Takes a `suggestions: string[]` prop, emits `select` and `dismiss`. No data fetching, no Pinia.
- **Modify** `src/components/AddressSearchControl.vue` — wrap field row in a positioned container, mount `<SearchSuggestions>`, wire up the composable, handle outside-click dismissal.

`AddressSearchControl.vue` is consumed by `Map.vue`, `TopicPanel.vue`, `VotingIntro.vue`, `AtlasIntro.vue`, and `CityAtlasIntro.vue` — single edit covers all surfaces (navbar and `/search` page).

---

### Task 1: Add `useSearchSuggestions` composable

**Files:**
- Create: `src/composables/useSearchSuggestions.js`

- [ ] **Step 1: Create the composable file**

Write `src/composables/useSearchSuggestions.js`:

```javascript
import { ref, toValue, watch } from 'vue';

export function useSearchSuggestions(search) {
  const searchSuggestions = ref([]);
  const searchSuggestionsError = ref(null);
  let skipNextFetch = false;

  async function getSearchSuggestions(stringValue) {
    if (!stringValue || stringValue.length < 3) {
      searchSuggestions.value = [];
      return;
    }

    try {
      const response = await fetch(
        `https://ais-autocomplete.citygeo.phila.city/autocomplete?q=${stringValue.replace(/ /, '+')}`
      );
      const suggestions = await response.json();
      const suggestedAddresses = suggestions.count
        ? Array.from(
            suggestions.results.addresses,
            (suggestion) => suggestion.address
          )
        : [];
      searchSuggestions.value = suggestedAddresses;
    } catch (err) {
      searchSuggestionsError.value = err;
    }
  }

  function dismissSuggestions() {
    skipNextFetch = true;
    searchSuggestions.value = [];
  }

  function hideSuggestions() {
    searchSuggestions.value = [];
  }

  function refetchSuggestions() {
    getSearchSuggestions(toValue(search));
  }

  watch(
    () => toValue(search),
    (value) => {
      if (skipNextFetch) {
        skipNextFetch = false;
        return;
      }
      getSearchSuggestions(value);
    }
  );

  return {
    searchSuggestions,
    searchSuggestionsError,
    dismissSuggestions,
    hideSuggestions,
    refetchSuggestions,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/composables/useSearchSuggestions.js
git commit -m "feat: add useSearchSuggestions composable for AIS autocomplete"
```

---

### Task 2: Add live-API integration test for the composable

**Files:**
- Create: `src/composables/useSearchSuggestions.test.js`

This mirrors the integration-test style of `src/stores/DorStore.test.js` and `src/stores/LiStore.test.js` — hits the live AIS endpoint to verify the contract atlas depends on. No mocks.

- [ ] **Step 1: Write the test**

Write `src/composables/useSearchSuggestions.test.js`:

```javascript
import { describe, it, expect } from 'vitest';

describe('AIS autocomplete API integration', () => {

  it('returns address suggestions for a typed prefix', async () => {
    const query = '1234 mar';
    const url = `https://ais-autocomplete.citygeo.phila.city/autocomplete?q=${query.replace(/ /, '+')}`;

    const response = await fetch(url);
    expect(response.ok).toBe(true);

    const data = await response.json();

    expect(data).toHaveProperty('count');
    expect(data).toHaveProperty('results');
    expect(data.results).toHaveProperty('addresses');
    expect(Array.isArray(data.results.addresses)).toBe(true);

    if (data.count > 0) {
      expect(data.results.addresses[0]).toHaveProperty('address');
      expect(typeof data.results.addresses[0].address).toBe('string');
    }
  });

});
```

- [ ] **Step 2: Run the test**

Run: `pnpm test src/composables/useSearchSuggestions.test.js`
Expected: PASS. Confirms the AIS endpoint shape matches what `useSearchSuggestions` expects (`count`, `results.addresses[].address`).

If FAIL because the API shape changed, stop and tell Andy — the composable's parsing needs to be updated to match reality, not the other way around.

- [ ] **Step 3: Commit**

```bash
git add src/composables/useSearchSuggestions.test.js
git commit -m "test: add AIS autocomplete API integration test"
```

---

### Task 3: Add `SearchSuggestions.vue` dropdown component

**Files:**
- Create: `src/components/SearchSuggestions.vue`

Ported from `pinboard-3/packages/ui/src/components/SearchSuggestions.vue`. Differences from the source: no TypeScript, styles use atlas-appropriate concrete values (no pinboard-3 design-system CSS variables), active/hover row uses a light grey background.

- [ ] **Step 1: Create the component file**

Write `src/components/SearchSuggestions.vue`:

```vue
<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  suggestions: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['select', 'dismiss']);

const activeIndex = ref(-1);
const listRef = ref(null);

watch(
  () => props.suggestions,
  () => {
    activeIndex.value = -1;
  }
);

function focusItem(index) {
  const items = listRef.value?.querySelectorAll('.search-suggestion');
  items?.[index]?.focus();
}

function focusFirst() {
  if (props.suggestions.length) {
    activeIndex.value = 0;
    focusItem(0);
  }
}

function handleKeydown(event) {
  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault();
      const next = Math.min(activeIndex.value + 1, props.suggestions.length - 1);
      activeIndex.value = next;
      focusItem(next);
      break;
    }
    case 'ArrowUp': {
      event.preventDefault();
      if (activeIndex.value <= 0) {
        activeIndex.value = -1;
        emit('dismiss');
      } else {
        activeIndex.value -= 1;
        focusItem(activeIndex.value);
      }
      break;
    }
    case 'Enter': {
      event.preventDefault();
      if (activeIndex.value >= 0) {
        emit('select', props.suggestions[activeIndex.value]);
      }
      break;
    }
    case 'Escape': {
      event.preventDefault();
      emit('dismiss');
      break;
    }
  }
}

defineExpose({ focusFirst });
</script>

<template>
  <div v-if="suggestions.length" class="search-suggestions-anchor">
    <ul
      ref="listRef"
      class="search-suggestions"
      role="listbox"
      @keydown="handleKeydown"
    >
      <li
        v-for="(suggestion, index) in suggestions"
        :key="suggestion"
        class="search-suggestion"
        :class="{ 'search-suggestion--active': index === activeIndex }"
        role="option"
        tabindex="-1"
        @click="emit('select', suggestion)"
      >
        {{ suggestion }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-suggestions-anchor {
  position: relative;
  width: 100%;
  height: 0;
}

.search-suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-height: 15rem;
  overflow-y: auto;
  z-index: 10;
}

.search-suggestion {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  color: #000;
  outline: none;
}

.search-suggestion:hover,
.search-suggestion:focus,
.search-suggestion--active {
  background-color: #f5f5f5;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SearchSuggestions.vue
git commit -m "feat: add SearchSuggestions dropdown component"
```

---

### Task 4: Wire autocomplete into `AddressSearchControl.vue`

**Files:**
- Modify: `src/components/AddressSearchControl.vue`

Wraps the existing `.field.has-addons` row in a positioned container, mounts `<SearchSuggestions>` underneath, wires the composable to `MainStore.addressSearchValue`, and handles select/dismiss + outside-click dismissal.

- [ ] **Step 1: Update `<script setup>`**

Replace the existing `<script setup>` block (lines 1–52) with:

```vue
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRef } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import { useMainStore } from '@/stores/MainStore.js';
import { useSearchSuggestions } from '@/composables/useSearchSuggestions.js';
import SearchSuggestions from '@/components/SearchSuggestions.vue';

const MainStore = useMainStore();

const router = useRouter();
const route = useRoute();

defineProps({
  inputId: {
    type: String,
    default: 'address-search-input',
  },
});

const inputRef = ref(null);
const wrapperRef = ref(null);

const { searchSuggestions, hideSuggestions, dismissSuggestions } =
  useSearchSuggestions(toRef(MainStore, 'addressSearchValue'));

const clearAddress = () => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('clearAddress is running');
  MainStore.addressSearchValue = '';
}

const fullScreenTopicsEnabled = computed(() => {
  return MainStore.fullScreenTopicsEnabled;
});
  
const fullScreenMapEnabled = computed(() => {
  return MainStore.fullScreenMapEnabled;
});
    
const holderWidth = computed(() => {
  if (fullScreenTopicsEnabled.value || fullScreenMapEnabled.value) {
    return '40%';
  } else {
    return '70%';
  }
});

const yPosition = computed(() => {
  if (fullScreenTopicsEnabled.value) {
    return '88px';
  } else {
    return '10px';
  }
});

const replaceRoute = (address) => {
  let startQuery = { ...route.query };
  router.replace({ name: 'search', query: { ...startQuery, address: address }});
}

const onSelectSuggestion = (suggestion) => {
  MainStore.addressSearchValue = suggestion;
  dismissSuggestions();
  replaceRoute(suggestion);
}

const onDismissSuggestions = () => {
  hideSuggestions();
  inputRef.value?.focus();
}

const onDocumentMouseDown = (event) => {
  if (!searchSuggestions.value.length) return;
  if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
    hideSuggestions();
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMouseDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown);
});
</script>
```

- [ ] **Step 2: Update the `<template>`**

Replace the existing `<template>` block with this. The wrapper has `ref="wrapperRef"`, the input has `ref="inputRef"`, and `<SearchSuggestions>` sits as a sibling of `.field.has-addons` inside the wrapper:

```vue
<template>
  <div
    ref="wrapperRef"
    :class="fullScreenTopicsEnabled ? 'holder holder-topics' : 'holder holder-map'"
    :style="{ top: yPosition, width: holderWidth }"
  >
    <div class="search-wrapper">
      <div
        class="field has-addons"
        :style="{ width: '100%' }"
      >
        <div
          class="control has-icons-right"
          :style="{ width: '100%' }"
        >
          <label
            :for="inputId"
            class="search-label"
          >Search for an address, OPA account, or DOR number</label>
          <input
            :id="inputId"
            ref="inputRef"
            v-model="MainStore.addressSearchValue"
            class="input address-input"
            type="text"
            placeholder="Search for an address, OPA account, or DOR number"
            @keydown.enter="replaceRoute(MainStore.addressSearchValue)"
          >
        </div>
        <div class="control">
          <button
            v-if="MainStore.addressSearchValue != ''"
            class="button is-info address-clear-button"
            title="Clear Address Button"
            @click="clearAddress"
          >
            <font-awesome-icon
              :icon="['fas', 'times']"
              size="xl"
            />
          </button>
        </div>
        <div class="control">
          <button
            class="button is-info address-search-button"
            type="submit"
            title="Address Search Button"
            @click="replaceRoute(MainStore.addressSearchValue)"
          >
            <font-awesome-icon
              :icon="['fas', 'search']"
              size="xl"
            />
          </button>
        </div>
      </div>
      <SearchSuggestions
        :suggestions="searchSuggestions"
        @select="onSelectSuggestion"
        @dismiss="onDismissSuggestions"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 3: Add `.search-wrapper` style**

Add this rule to the `<style scoped>` block, after the existing `.holder-topics` rule (~line 131):

```css
.search-wrapper {
  position: relative;
  width: 100%;
}
```

No other styles change.

- [ ] **Step 4: Manual verification — golden path**

Andy runs the dev server. Verify in a browser:

1. Type `1234 mar` into the navbar search bar — dropdown appears under the field with entries like `1234 MARKET ST`, `1234 MARLBOROUGH ST`, `1234 MARLYN RD`, `1234 S MARKOE ST`.
2. Click `1234 MARKET ST` — input fills with that address, page routes to the address detail view.
3. Type `1234 mar` again, press `↓` `↓` `Enter` — same result via keyboard.

If any of these fail, stop and report what you see.

- [ ] **Step 5: Manual verification — edge cases**

1. Type `12` (two chars) — no dropdown appears.
2. Type `1234 mar` then press `Escape` — dropdown closes, input retains `1234 mar`.
3. Type `1234 mar` then click somewhere outside the search (the map area) — dropdown closes.
4. Type an OPA-style number (e.g. `881018000`) — no dropdown appears; pressing Enter still submits and routes normally.
5. Navigate to `/search` page (or use a route where the same search bar renders inside `TopicPanel` / intros) — autocomplete still works there.

If any of these fail, stop and report what you see.

- [ ] **Step 6: Commit**

```bash
git add src/components/AddressSearchControl.vue
git commit -m "feat: wire AIS autocomplete into AddressSearchControl"
```

---

### Task 5: Update handoff and design status

**Files:**
- Modify: `.claude/handoff.md`

Atlas's handoff file tracks open work. After implementation passes manual verification, this task updates it.

- [ ] **Step 1: Replace the handoff with current status**

Overwrite `.claude/handoff.md` with a concise summary of the AIS autocomplete work: branch (`feat/ais-autocomplete`), commits added, manual verification result, and any remaining work (PR creation). Reuse the format from the prior handoff — `## Current Task`, `## Status`, `## Next Step`, `## Notes`.

- [ ] **Step 2: Commit**

```bash
git add .claude/handoff.md
git commit -m "docs: update handoff for AIS autocomplete completion"
```

---

## Self-Review

**1. Spec coverage:**
- "Files added": Task 1 (composable), Task 3 (component) ✓
- "Wiring into AddressSearchControl": Task 4, all 5 sub-steps from the spec (positioned wrapper, mount, select handler, dismiss handler, outside-click) ✓
- "Behavior": Task 4 manual verification steps cover both surfaces, OPA/DOR fallthrough, no-debounce behavior ✓
- "Out of scope": no GeocodeStore changes, no debounce, no shared-package extraction — none of these appear in any task ✓

**2. Placeholder scan:** No TBDs, no "handle edge cases", no "implement later". All code blocks are complete.

**3. Type/method consistency:** Composable returns `{ searchSuggestions, searchSuggestionsError, dismissSuggestions, hideSuggestions, refetchSuggestions }`. Task 4 destructures `{ searchSuggestions, hideSuggestions, dismissSuggestions }` — names match. Component emits `select` and `dismiss`; Task 4 listens for `@select` and `@dismiss` — match. Input prop is `suggestions` in both Task 3 definition and Task 4 binding — match.
