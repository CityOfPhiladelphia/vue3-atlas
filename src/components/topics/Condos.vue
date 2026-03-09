<script setup>

import { computed, watch, onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router'
const route = useRoute();

import { useCondosStore } from '@/stores/CondosStore';
const CondosStore = useCondosStore();

import CustomPaginationLabelsCondos from '@/components/pagination/CustomPaginationLabelsCondos.vue';

const totalSize = computed(() => CondosStore.condosData.total_size);

const paginationOptions = (tableLength) => ({
  enabled: !CondosStore.searchActive && tableLength > 5,
  mode: 'pages',
  perPage: 10,
  position: 'top',
  dropdownAllowAll: false,
  nextLabel: '',
  prevLabel: '',
  rowsPerPageLabel: '# rows',
  ofLabel: 'of',
  pageLabel: 'page', // for 'pages' mode
  allLabel: 'All',
  // infoFn: (params) => {
  //   return `${params.firstRecordOnPage} - ${params.lastRecordOnPage} of ${totalSize.value}`
  // }
});

watch (
  () => route.params.data,
  (newPage) => {
    CondosStore.lastPageUsed = parseInt(newPage);
  }
)

onMounted( () => {
  CondosStore.lastPageUsed = parseInt(route.params.data);
  if (import.meta.env.VITE_DEBUG == 'true') console.log('Condos.vue onMounted, CondosStore.lastPageUsed:', CondosStore.lastPageUsed);
});

const searchInput = ref('');

const handleSearch = async () => {
  await CondosStore.submitSearch(searchInput.value);
};

const handleClear = () => {
  searchInput.value = '';
  CondosStore.clearSearch();
};

const condos = computed(() => {
  let features = [];
  if (import.meta.env.VITE_DEBUG == 'true') console.log('Object.keys(CondosStore.condosData.pages).sort():', Object.keys(CondosStore.condosData.pages).sort());
  for (let dataPage of Object.keys(CondosStore.condosData.pages).sort()) {
    features = features.concat(CondosStore.condosData.pages[dataPage].features);
  }
  return features;
});

const filteredCondos = computed(() => {
  if (!CondosStore.searchActive) return null;
  const term = CondosStore.searchTerm.toLowerCase();
  return condos.value.filter(f => {
    const unitNum = (f.properties.unit_num || '').toLowerCase();
    return unitNum.includes(term);
  });
});

const condosTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Address',
        field: 'properties.link',
        html: true,
      },
      {
        label: 'OPA Account #',
        field: 'properties.opa_account_num',
      },
    ],
    rows: CondosStore.searchActive ? (filteredCondos.value || []) : (condos.value || []),
  }
});

</script>

<template>
  <section>
    <div
      id="Condominiums-description"
      class="topic-info"
    >
      Condominium units at your search address, as recorded for property assessment purposes. Click one of the addresses below to see information for that unit. Use the back button to return to this list. Source: Office of Property Assessment
    </div>

    <div class="topic-info">
      Note: Occasionally, similar addresses may be listed here that are not part of a planned community. Refer to the deed and other legal documents for legal definitions, relationships, and obligations pertaining to any property.
    </div>

    <h2 class="subtitle mb-3 is-5">
      Condominiums
      <font-awesome-icon
        v-if="CondosStore.loadingCondosData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ totalSize }})</span>
    </h2>

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

    <div class="horizontal-table">
      <vue-good-table
        id="condos"
        :columns="condosTableData.columns"
        :rows="condosTableData.rows"
        :total-rows="totalSize"
        style-class="table"
        :pagination-options="paginationOptions(condosTableData.rows.length)"
        :sort-options="{ enabled: false }"
      >
        <template #table-row="props">
          <span v-if="props.column.label == 'Address'">
            <router-link :to="{ name: 'address-and-topic', params: { address: props.row.properties.opa_address, topic: 'property'} }">{{ props.row.properties.opa_address }}</router-link>
          </span>
        </template>
        <template #emptystate>
          <div v-if="CondosStore.loadingCondosData">
            Loading more condos... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else>
            No Condos found
          </div>
        </template>
        <template #pagination-top="props">
          <custom-pagination-labels-condos
            :mode="'pages'"
            :total="props.total"
            :page-changed="props.pageChanged"
            :per-page-changed="props.perPageChanged"
          />
        </template>
      </vue-good-table>
    </div>
  </section>
</template>

<style scoped>

.pagination-previous {
  font-weight: bold !important;
}

.pagination-next {
  justify-content: flex-end !important;
  font-weight: bold !important;
}

@media
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {

  .pagination-link {
    margin: 0px !important;
    /* padding: 0px; */
    min-width: 16px !important;
  }

  .pagination-ellipsis {
    margin: 0px !important;
    min-width: 16px !important;
  }

  .pagination-previous {
    margin: 0px !important;
    min-width: 16px !important;
    font-weight: bold !important;
  }

  .pagination-next {
    margin: 0px !important;
    min-width: 16px !important;
    justify-content: flex-end !important;
    font-weight: bold !important;
  }

  .horizontal-table {

    td:nth-of-type(2) { min-height: 60px; }
    /* Label the data */
    td:nth-of-type(1):before { content: "Address"; }
    td:nth-of-type(2):before { content: "OPA Account #"; }
  }

}

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

</style>
