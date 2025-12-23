<script setup>

import { computed, watch, onMounted } from 'vue';
import { RouterLink, useRoute } from 'vue-router'
const route = useRoute();

import { useCondosStore } from '@/stores/CondosStore';
const CondosStore = useCondosStore();

import CustomPaginationLabelsCondos from '@/components/pagination/CustomPaginationLabelsCondos.vue';

const totalSize = computed(() => CondosStore.condosData.total_size);

const paginationOptions = (tableLength) => ({
  enabled: tableLength > 5,
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

const condos = computed(() => {
  if (CondosStore.loadingCondosData) {
    return [];
  }
  let features = [];
  if (import.meta.env.VITE_DEBUG == 'true') console.log('Object.keys(CondosStore.condosData.pages).sort():', Object.keys(CondosStore.condosData.pages).sort());
  for (let dataPage of Object.keys(CondosStore.condosData.pages).sort()) {
    features = features.concat(CondosStore.condosData.pages[dataPage].features);
  }
  return features;
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
    rows: condos.value || [],
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

    <h2 class="subtitle mb-3 is-5">
      Condominiums ({{ totalSize }})
    </h2>

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

</style>
