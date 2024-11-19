<script setup>
import $config from '@/config';
import { computed, onBeforeMount } from 'vue';

import { useParcelsStore } from '@/stores/ParcelsStore';
const ParcelsStore = useParcelsStore();
import { useZoningStore } from '@/stores/ZoningStore';
const ZoningStore = useZoningStore();
import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();
import CollectionSummary from '@/components/CollectionSummary.vue';

import CustomPaginationLabels from '@/components/pagination/CustomPaginationLabels.vue';
import useTables from '@/composables/useTables';
const { paginationOptions } = useTables();

let selectedParcelId = computed(() => { return MainStore.selectedParcelId });
const selectedParcel = computed(() => {
  if (ParcelsStore.dor.features && ParcelsStore.dor.features.length > 0) {
    return ParcelsStore.dor.features.filter(feature => feature.id === selectedParcelId.value)[0];
  }
});

// ZONING OVERLAYS
const zoningOverlays = computed(() => {
  if (!ZoningStore.zoningOverlays[selectedParcelId.value]) return [];
  return ZoningStore.zoningOverlays[selectedParcelId.value].rows || [];
});

// ZONING APPEALS
const zoningAppealsCompareFn = (a, b) => new Date(b.scheduleddate) - new Date(a.scheduleddate);
const zoningAppeals = computed(() => {
  if (!ZoningStore.zoningAppeals.rows) return [];
  return [ ...ZoningStore.zoningAppeals.rows ].sort(zoningAppealsCompareFn);
});

onBeforeMount(() => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('Zoning.vue onBeforeMount');
  if (ParcelsStore.dor.features && ParcelsStore.dor.features.length > 0) {
    MainStore.selectedParcelId = ParcelsStore.dor.features[0].properties.OBJECTID;
  }
});

const longCodes = computed(() => {
  if (ZoningStore.zoningBase[selectedParcelId.value] && ZoningStore.zoningBase[selectedParcelId.value].rows) {
    const codes = [];
    for (let row of ZoningStore.zoningBase[selectedParcelId.value].rows) {
      codes.push(row.long_code);
    }
    return codes;
  }
});

const hexesForLongCodes = computed(() => {
  const hexes = [];
  if (longCodes.value) {
    for (let code of longCodes.value) {
      hexes.push($config.ZONING_CODE_MAP[code].color);
    }
  }
  return hexes;
  // if (ZoningStore.zoningBase[selectedParcelId.value] && ZoningStore.zoningBase[selectedParcelId.value].rows) {
  //   const longCode = ZoningStore.zoningBase[selectedParcelId.value].rows[0].long_code;
  //   return $config.ZONING_CODE_MAP[longCode].color;
  // }
});

const descriptions = computed(() => {
  const descriptions = [];
  if (longCodes.value) {
    for (let code of longCodes.value) {
      descriptions.push($config.ZONING_CODE_MAP[code].description);
    }
  }
  return descriptions;
  // if (ZoningStore.zoningBase[selectedParcelId.value] && ZoningStore.zoningBase[selectedParcelId.value].rows) {
  //   return $config.ZONING_CODE_MAP[ZoningStore.zoningBase[selectedParcelId.value].rows[0].long_code].description;
  // }
})

const pendingBillsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Bill Type',
        field: 'billType',
      },
      {
        label: 'Current Zoning',
        field: 'currentZoning',
      },
      {
        label: 'Pending Bill',
        field: 'pendingbillurl',
        html: true,
      },
    ],
    rows: ZoningStore.pendingBills[selectedParcelId.value] || [],
  }
});

const overlaysTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Name',
        field: 'overlay_name',
      },
      {
        label: 'Code Section',
        field: 'link',
        html: true,
      },
    ],
    rows: zoningOverlays.value || [],
  }
});

const appealsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Processed Date',
        field: 'createddate',
        type: 'date',
        dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'Id',
        field: 'link',
        html: true,
      },
      {
        label: 'Description & Coordinating RCO',
        field: 'appealgrounds',
      },
      {
        label: 'Scheduled Date',
        field: 'scheduleddate',
        type: 'date',
        dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'Status',
        field: 'decision',
      },
    ],
    rows: zoningAppeals.value || [],
  }
});

const rcosTableData = computed(() => {
  return {
    columns: [
      {
        label: 'RCO',
        field: 'properties.rco',
        html: true,
      },
      {
        label: 'Meeting Address',
        field: 'properties.MEETING_LOCATION_ADDRESS',
      },
      {
        label: 'Primary Contact',
        field: 'properties.contact',
        html: true,
      },
      {
        label: 'Preferred Method',
        field: 'properties.PREFFERED_CONTACT_METHOD',
      },
    ],
    rows: ZoningStore.rcos.features || [],
  }
});

</script>

<template>
  <div
    id="Zoning-description"
    class="topic-info"
  >
    Base district zoning maps, associated zoning overlays, and Registered Community Organizations applicable to your search address. If you notice a discrepancy, please contact <a href="mailto:planning@phila.gov">planning@phila.gov</a>. Source: Department of Planning and Development
  </div>
  <collection-summary
    :value="'STATUS'"
    :descriptor="'parcel'"
  />
  <div
    v-if="selectedParcel"
    id="parcel-div"
    class="section add-borders p-2"
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

      <div class="data-section has-text-centered">
        <div
          v-if="selectedParcel"
          class="columns mt-6 mb-5"
        >
          <div class="columns is-multiline column is-10 is-offset-1 has-text-centered badge">
            <div class="column is-12 columns pt-0 pb-0">
              <div class="column is-12 badge-title">
                <b v-if="longCodes && longCodes.length > 1">Base Districts</b>
                <b v-else>Base District</b>
              </div>
            </div>
            <div
              v-if="longCodes"
              v-for="longCode in longCodes"
              class="column is-12 columns is-mobile pt-0 pb-0"
            >
              <div class="column is-2 badge-cell">
                <div :style="{ 'height': '36px', 'width': '36px', 'background-color': $config.ZONING_CODE_MAP[longCode].color }" />
              </div>
              <div class="column is-3 badge-cell">
                <b>{{ longCode }}</b>
              </div>
              <div class="column is-7 badge-cell">
                {{ $config.ZONING_CODE_MAP[longCode].description }}
              </div>
            </div>
            <div
              v-else
              class="column is-12 columns pt-0 pb-0"
            >
              <div class="column is-12 badge-spinning pt-2 pb-2">
                <font-awesome-icon
                  icon="fa-solid fa-spinner"
                  size="2x"
                  spin
                />
              </div>
            </div>
          </div>
        </div>
        <a
          class="table-link"
          target="_blank"
          href="https://www.phila.gov/media/20220909084529/ZONING-QUICK-GUIDE_PCPC_9_9_22.pdf"
        >See more info about zoning codes [PDF] <font-awesome-icon icon="fa-solid fa-external-link-alt" /></a>
      </div>

      <div class="data-section">
        <h2 class="subtitle mb-3 is-5 table-title">
          Pending Bills
          <font-awesome-icon
            v-if="ZoningStore.loadingPendingBills"
            icon="fa-solid fa-spinner"
            spin
          />
          <span v-else>({{ pendingBillsTableData.rows.length }})</span>
        </h2>
        <div class="horizontal-table">
          <vue-good-table
            id="pending-bills"
            :columns="pendingBillsTableData.columns"
            :rows="pendingBillsTableData.rows"
            :pagination-options="paginationOptions(pendingBillsTableData.rows.length)"
            style-class="table"
          >
            <template #emptystate>
              <div v-if="ZoningStore.loadingPendingBills">
                Loading pending bills... <font-awesome-icon
                  icon="fa-solid fa-spinner"
                  spin
                />
              </div>
              <div v-else>
                No pending bills found
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

      <div class="data-section">
        <h2 class="subtitle mb-3 is-5 table-title">
          Overlays
          <font-awesome-icon
            v-if="ZoningStore.loadingZoningOverlays"
            icon="fa-solid fa-spinner"
            spin
          />
          <span v-else>({{ overlaysTableData.rows.length }})</span>
        </h2>
        <vue-good-table
          id="overlays"
          :columns="overlaysTableData.columns"
          :rows="overlaysTableData.rows"
          :pagination-options="paginationOptions(overlaysTableData.rows.length)"
          style-class="table"
        >
          <template #emptystate>
            <div v-if="ZoningStore.loadingZoningOverlays">
              Loading overlays... <font-awesome-icon
                icon="fa-solid fa-spinner"
                spin
              />
            </div>
            <div v-else>
              No overlays found
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

  <div class="data-section">
    <h2 class="subtitle mb-3 is-5 table-title">
      Appeals
      <font-awesome-icon
        v-if="ZoningStore.loadingZoningAppeals"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ zoningAppeals.length }})</span>
    </h2>
    <div class="horizontal-table">
      <vue-good-table
        id="appeals"
        :columns="appealsTableData.columns"
        :rows="appealsTableData.rows"
        :pagination-options="paginationOptions(appealsTableData.rows.length)"
        style-class="table"
      >
        <template #emptystate>
          <div v-if="ZoningStore.loadingZoningAppeals">
            Loading appeals... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else>
            No appeals found
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
        <template #table-row='props'>
          <span v-if="props.column.field === 'appealgrounds'">
            {{ props.row.appealgrounds }}<br>
            <span v-if="props.row.coordinatingrco">
              <b>Coordinating RCO:</b> {{ props.row.coordinatingrco || 'N/A' }}
            </span>
          </span>
        </template>

      </vue-good-table>
    </div>
  </div>

  <!-- <div class="topic-info mt-6 mb-2">
    Looking for zoning documents? They are now located in the Licenses & Inspections tab under "Zoning Permit Documents".
  </div> -->

  <div class="data-section">
    <h2 class="subtitle mb-3 is-5 table-title">
      Registered Community Organizations (RCOs)
      <font-awesome-icon
        v-if="ZoningStore.loadingRcos"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ rcosTableData.rows.length }})</span>
    </h2>
    <div
      id="rcos"
      class="horizontal-table"
    >
      <vue-good-table
        id="rcos"
        :columns="rcosTableData.columns"
        :rows="rcosTableData.rows"
        :pagination-options="paginationOptions(rcosTableData.rows.length)"
        style-class="table"
      >
        <template #emptystate>
          <div v-if="ZoningStore.loadingRcos">
            Loading RCOs... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else>
            No RCOs found
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
    <a
      class="table-link"
      target="_blank"
      href="//www.phila.gov/documents/registered-community-organization-rco-materials/"
    >See a list of all RCOs in the city <font-awesome-icon icon="fa-solid fa-external-link-alt" /></a>
  </div>
</template>

<style>

#parcel-div {
  margin-bottom: 1.5rem;
}

.badge-title {
  padding-top: 0.25rem !important;
  height: 2rem;
  color: white;
  /* background-color: #f0f0f0; */
  background-color: rgb(68, 68, 68);
  border-style: solid;
  border-color: white;
  border-width: 1px;
  padding-left: 0px !important;
  padding-right: 0px !important;
}

.badge-spinning {
  background-color: #f0f0f0;
}

.badge-cell {
  background-color: #f0f0f0;
  border-style: solid;
  border-color: white;
  border-width: 1px;
  display: flex !important;
  align-items: center;
  justify-content: center;
  /* padding: 0px; */
}

@media 
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {

	/* Label the data */
	#pending-bills {
    td {
      min-height: 60px;
    }

    td:nth-of-type(1):before { content: "Bill Type"; }
    td:nth-of-type(2):before { content: "Current Zoning"; }
    td:nth-of-type(3):before { content: "Pending Bill"; }
  }

  #overlays {
    td {
      min-height: 60px;
    }

    td:nth-of-type(1):before { content: "Name"; }
    td:nth-of-type(2):before { content: "Code Section"; }
  }

  #appeals {
    td {
      min-height: 60px;
    }

    td:nth-of-type(1):before { content: "Processed Date"; }
    td:nth-of-type(2):before { content: "Id"; }
    td:nth-of-type(3):before { content: "Description"; }
    td:nth-of-type(4):before { content: "Scheduled Date"; }
    td:nth-of-type(5):before { content: "Status"; }
  }

  #rcos {
    td {
      min-height: 60px;
    }

    td:nth-of-type(1):before { content: "RCO"; }
    td:nth-of-type(2):before { content: "Meeting Address"; }
    td:nth-of-type(3):before { content: "Primary Contact"; }
    td:nth-of-type(4):before { content: "Preferred Method"; }
  }
}

#rcos {
  td:nth-of-type(2) span { 
    word-wrap: break-word !important;
    display: inline-block !important;
    max-width: 180px !important;
  }
}

</style>