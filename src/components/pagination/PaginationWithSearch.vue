<script setup>
import CustomPaginationLabels from './CustomPaginationLabels.vue';

// a table search input sharing the pagination row - the house pattern for searching
// data tables (permits, business licenses; see useTableSearch for the term's wiring).
// Lives inside vue-good-table's #pagination-top slot, so callers must keep pagination
// enabled off the UNFILTERED row count or the slot (and this input) vanishes mid-search.
defineProps({
  searchEnabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: 'Search',
  },
  total: {
    type: Number,
    default: 0,
  },
  perPage: {
    type: Number,
    default: 5,
  },
});

defineEmits(['page-changed', 'per-page-changed']);

const term = defineModel();
</script>

<template>
  <div class="pagination-with-search">
    <div
      v-if="searchEnabled"
      class="pagination-search-wrap"
    >
      <input
        v-model="term"
        type="text"
        class="pagination-search-input"
        :placeholder="placeholder"
        :aria-label="placeholder"
      >
      <button
        v-if="term"
        type="button"
        class="pagination-search-clear"
        aria-label="Clear search"
        @click="term = ''"
      >
        <font-awesome-icon
          :icon="['fas', 'times']"
          size="lg"
        />
      </button>
    </div>
    <custom-pagination-labels
      :mode="'pages'"
      :total="total"
      :per-page="perPage"
      @page-changed="$emit('page-changed', $event)"
      @per-page-changed="$emit('per-page-changed', $event)"
    />
  </div>
</template>

<style>
.pagination-with-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 2px;
}

.pagination-search-wrap {
  position: relative;
  flex: 1 1 220px;
  max-width: 340px;
  min-width: 180px;
}

.pagination-search-input {
  width: 100%;
  padding: 4px 28px 4px 8px;
  border: 1px solid #cccccc;
  border-radius: 2px;
  font-size: 14px;
}

.pagination-search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: #666666;
}

/* the pagination labels keep enough width that their controls never wrap */
.pagination-with-search .vgt-wrap__footer {
  flex: 1 0 310px;
}
</style>
