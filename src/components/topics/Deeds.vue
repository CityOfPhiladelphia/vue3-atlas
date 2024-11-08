<script setup>

import { ref, computed, onBeforeMount } from 'vue';

import useTransforms from '@/composables/useTransforms';
const { date, integer, prettyNumber } = useTransforms();

import CustomPaginationLabels from '@/components/pagination/CustomPaginationLabels.vue';
import useTables from '@/composables/useTables';
const { paginationOptions } = useTables();

import { useParcelsStore } from '@/stores/ParcelsStore';
const ParcelsStore = useParcelsStore();
import { useDorStore } from '@/stores/DorStore';
const DorStore = useDorStore();
import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();
import CollectionSummary from '@/components/CollectionSummary.vue';
import VerticalTable from '@/components/VerticalTable.vue';

import TextFilter from '@/components/TextFilter.vue';
const textSearch = ref('');

let selectedParcelId = computed(() => { return MainStore.selectedParcelId });
const selectedParcel = computed(() => {
  if (ParcelsStore.dor.features && ParcelsStore.dor.features.length > 0) {
    return ParcelsStore.dor.features.filter(feature => feature.id === selectedParcelId.value)[0];
  } else {
    return null;
  }
});
const selectedDocs = computed(() => {
  if (selectedParcelId.value && DorStore.dorDocuments[selectedParcelId.value]) {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('selectedParcelId.value:', selectedParcelId.value);
    let data = [];
    for (let feature of DorStore.dorDocuments[selectedParcelId.value].features) {
      if (feature.attributes.GRANTORS != null && feature.attributes.GRANTORS.toLowerCase().includes(textSearch.value.toLowerCase())
        || feature.attributes.GRANTEES != null && feature.attributes.GRANTEES.toLowerCase().includes(textSearch.value.toLowerCase())
        || feature.attributes.UNIT_NUM != null && feature.attributes.UNIT_NUM.toLowerCase().includes(textSearch.value.toLowerCase())
      ){
        data.push({
          ...feature.attributes,
        });
      }
    }
    data.sort((a, b) => new Date(b.DISPLAY_DATE) - new Date(a.DISPLAY_DATE));
    return data;
  } else {
    return null;
  }
});
const selectedDocsLength = computed(() => {
  return selectedDocs.value ? selectedDocs.value.length : 0;
});

const selectedCondos = computed(() => {
  if (selectedParcelId.value && DorStore.dorCondos[selectedParcelId.value]) {
    return DorStore.dorCondos[selectedParcelId.value].rows;
  } else {
    return null;
  }
});

const selectedCondosLength = computed(() => {
  return selectedCondos.value ? selectedCondos.value.length : 0;
});

const regmaps = computed(() => {
  if (!DorStore.regmaps.data) {
    return [];
  }
  return DorStore.regmaps.data.features;
});

onBeforeMount(() => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('Deeds.vue onBeforeMount');
  if (ParcelsStore.dor.features && ParcelsStore.dor.features.length > 0) {
    MainStore.selectedParcelId = ParcelsStore.dor.features[0].properties.OBJECTID;
  }
});

const statusKey = {
  1: 'Active',
  2: 'Inactive',
  3: 'Remainder',
  9: 'Unknown Status',
}

const addRegmapLayer = (regmap) => {
  if (MapStore.selectedRegmap === regmap) {
    MapStore.selectedRegmap = null;
  } else {
    MapStore.selectedRegmap = regmap;
  }
}

const selectedRegmap = computed(() => {
  return MapStore.selectedRegmap;
});

const deededCondosExist = computed(() => {
  let flag = false;
  if (DorStore.dorCondos[selectedParcelId.value] && DorStore.dorCondos[selectedParcelId.value].rows && DorStore.dorCondos[selectedParcelId.value].rows.length > 0) {
    flag = true;
  }
  return flag;
});

const getAddress = (address) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('address:', address, address.length);
  if (address && address.length > 2) {
    return address;
  } else {
    return 'Parcel has no address';
  }
}

const parcelData = computed(() => [
  {
    label: 'Map Registry #',
    value: selectedParcel.value ? selectedParcel.value.properties.MAPREG : '',
  },
  {
    label: 'Parcel Address',
    value: selectedParcel.value ? getAddress(selectedParcel.value.properties.ADDR_SOURCE) : '',
  },
  {
    label: 'Status',
    value: selectedParcel.value ? statusKey[selectedParcel.value.properties.STATUS] : '',
  },
  {
    label: 'Origination Date',
    value: selectedParcel.value ? date(selectedParcel.value.properties.ORIG_DATE) || 'None' : 'None',
  },
  {
    label: 'Inactive Date',
    value: selectedParcel.value ? date(selectedParcel.value.properties.INACTDATE) || 'None' : 'None',
  },
  {
    label: 'Has Air Rights',
    value: selectedParcel.value ? selectedParcel.value.properties.SUFFIX ? 'Yes' : 'No' : '',
  },
  {
    label: 'Is Condo',
    value: selectedParcel.value ? !selectedParcel.value.properties.CONDOFLAG ? 'No' : 'Yes' : '',
  },
  {
    label: 'Perimeter',
    value: selectedParcel.value ? prettyNumber(integer(selectedParcel.value.properties.TURF_PERIMETER)) + ' ft' : '',
  },
  {
    label: 'Area',
    value: selectedParcel.value ? prettyNumber(integer(selectedParcel.value.properties.TURF_AREA)) + ' sq ft' : '',
  },
]);

const condosTableData = ref({
  columns: [
    {
      label: 'Condo Parcel',
      field: 'condo_parcel',
    },
    {
      label: 'Condo Name',
      field: 'condo_name',
    },
    {
      label: 'Unit #',
      field: 'unit_number',
    },
  ],
  rows: selectedCondos,
});

const dorDocsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'ID',
        field: 'link',
        html: true,
      },
      {
        label: 'Date',
        field: 'date',
        type: 'date',
        dateInputFormat: 'MM/dd/yyyy',
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'Type',
        field: 'DOCUMENT_TYPE',
      },
      {
        label: 'Grantor',
        field: 'GRANTORS',
      },
      {
        label: 'Grantee',
        field: 'GRANTEES',
      },
      {
        label: 'Unit #',
        field: 'UNIT_NUM',
      }
    ],
    rows: selectedDocs.value || [],
  }
});

</script>

<template>
  <div
    id="Deeds-description"
    class="topic-info"
  >
    Deed information and document transactions for this address. The map faithfully reflects property boundaries as described in recorded deeds including multiple types of easements. The property boundaries displayed on the map are for reference only and should not be used in place of the recorded deeds or land surveys. Source: Department of Records
  </div>
  <collection-summary
    :value="'STATUS'"
    :descriptor="'parcel'"
  />
  <div
    v-if="selectedParcel"
    id="parcel-div"
    class="columns add-borders p-2 mt-2"
  >
    <div class="column is-12">
      <div class="columns is-multiline is-mobile">
        <button
          v-for="parcel in ParcelsStore.dor.features"
          :key="parcel.properties.OBJECTID"
          class="dor-parcel-select column is-one-quarter-desktop is-half-mobile has-text-centered add-borders p-2"
          :class="{ 'is-selected': parcel.properties.OBJECTID === selectedParcelId }"
          @click="MainStore.selectedParcelId = parcel.properties.OBJECTID"
        >
          {{ parcel.properties.MAPREG }}
        </button>
      </div>

      <h2 class="subtitle is-5 vert-table-title">
        Parcel Details
      </h2>
      <vertical-table
        v-if="selectedParcel"
        table-id="dorTable"
        :data="parcelData"
      />

      <div
        v-if="deededCondosExist"
        class="mt-6 mb-4"
      >
        <h2 class="subtitle is-5 table-title">
          Deeded Condominiums ({{ selectedCondosLength }})
        </h2>
        <vue-good-table
          :columns="condosTableData.columns"
          :rows="condosTableData.rows"
          :pagination-options="paginationOptions(condosTableData.rows.length)"
          style-class="table"
        >
          <template #pagination-top="props">
            <custom-pagination-labels
              :mode="'pages'"
              :total="props.total"
              :perPage="5"
              @page-changed="props.pageChanged"
              @per-page-changed="props.perPageChanged"
            >
            </custom-pagination-labels>
          </template>
        </vue-good-table>
      </div>

      <div class="topic-info mt-6">
        You can access a view-only, watermarked unofficial copy of the deeds below at
        no cost by clicking on the deeds below. In order to view and print non-watermarked 
        copies of the deeds below, you must purchase a subscription to 
        <a
          target="_blank"
          href="https://epay.phila-records.com/phillyepay/web/"
        >PhilaDox</a>.
        Please note that the following list shows documents recorded from December 1999 forward,
        and may not be a complete history of title for the parcel.
      </div>

      <!-- DOR Docs Table -->

      <div class="mt-4">
        <h2 class="subtitle mb-3 is-5">
          Documents <font-awesome-icon
          v-if="DorStore.loadingDorData"
          icon="fa-solid fa-spinner"
          spin
        /><span v-else>({{ selectedDocsLength }})</span>
        </h2>
        <TextFilter
          class="dor-docs-filter"
          :search-label="'Search Documents'"
          :placeholder="'Search Documents'"
          v-model="textSearch"
        />
        <div class="horizontal-table">
          <vue-good-table
            id="dor-documents"
            :columns="dorDocsTableData.columns"
            :rows="dorDocsTableData.rows"
            style-class="table"
            :pagination-options="paginationOptions(dorDocsTableData.rows.length)"
          >
            <template #emptystate>
              <div v-if="DorStore.loadingDorData">
                Loading DOR Documents... <font-awesome-icon
                  icon="fa-solid fa-spinner"
                  spin
                />
              </div>
              <div v-else>
                No DOR Documents found
              </div>
            </template>
            <template #pagination-top="props">
              <custom-pagination-labels
                :mode="'pages'"
                :total="props.total"
                :perPage="5"
                @page-changed="props.pageChanged"
                @per-page-changed="props.perPageChanged"
              >
              </custom-pagination-labels>
            </template>
          </vue-good-table>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="selectedParcel"
    class="topic-info"
  >
    Use the buttons below to view images of hard-copy deed maps, some of which have handwritten information that may be useful for historical deed research.
  </div>

  <!-- Registry Maps -->
  <div
    v-if="selectedParcel"
    class="mb-4"
  >
    <h2 class="subtitle mb-5 is-5">
      Registry Maps
    </h2>
    <div class="columns is-multiline is-mobile">
      <button
        v-for="regmap in regmaps"
        :key="regmap.properties.RECMAP"
        class="regmap-button column is-2-desktop is-3-mobile add-borders has-text-centered p-1 mr-1 ml-1 mb-1"
        :class="{ 'is-selected': regmap.properties.RECMAP === selectedRegmap }"
        @click="addRegmapLayer(regmap.properties.RECMAP)"
      >
        {{ regmap.properties.RECMAP }}
      </button>
    </div>
  </div>
</template>

<style>

.dor-docs-filter {
  margin-left: -4px !important;
}

.dor-parcel-select {
  color: #444444;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
}

.dor-parcel-select:hover {
  background-color: #f0f0f0;
}

#parcel-div {
  padding: 0px !important;
  margin-bottom: 1.5rem;
}

.regmap-button {
  background-color: white !important;
  border-color: #0f4d90 !important;
  font-size: 1rem;
  color: #0f4d90;
  cursor: pointer;
}

.regmap-button:hover {
  background-color: #f0f0f0 !important;
}

.regmap-button.is-selected {
  background-color: #0f4d90 !important;
  color: white !important;
}

@media 
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {
	/*Label the data*/

  #dor-documents {
    td:nth-of-type(1):before { content: "ID"; }
    td:nth-of-type(2):before { content: "Date"; }
    td:nth-of-type(3):before { content: "Type"; }
    td:nth-of-type(4):before { content: "Grantor"; }
    td:nth-of-type(5):before { content: "Grantee"; }
    td:nth-of-type(6):before { content: "Unit #"; }
  }

}

</style>