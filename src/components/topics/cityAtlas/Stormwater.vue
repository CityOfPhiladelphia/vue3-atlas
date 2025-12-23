<script setup>

import { computed } from 'vue';

import { useStormwaterStore } from '@/stores/StormwaterStore.js'
const StormwaterStore = useStormwaterStore();

import VerticalTable from '@/components/VerticalTable.vue';

import useTransforms from '@/composables/useTransforms';
const { thousandsPlace } = useTransforms();

import CustomPaginationLabels from '@/components/pagination/CustomPaginationLabels.vue';
import useTables from '@/composables/useTables';
const { paginationOptions } = useTables();

const stormwaterData = computed(() => {
  let data;
  if (StormwaterStore.stormwaterData && Object.keys(StormwaterStore.stormwaterData).length) {
    data = StormwaterStore.stormwaterData
  }
  return data;
})

const parcelId = computed(() => {
  let value;
  if (StormwaterStore.stormwaterData && Object.keys(StormwaterStore.stormwaterData).length) {
    value = StormwaterStore.stormwaterData.Parcel.ParcelID
  }
  return value;
})

const accounts = computed(() => {
  let data;
  if (StormwaterStore.stormwaterData && Object.keys(StormwaterStore.stormwaterData).length) {
    data = StormwaterStore.stormwaterData.Accounts
  }
  return data;
})

const accountsLength = computed(() => {
  let value = 0;
  if (StormwaterStore.stormwaterData && Object.keys(StormwaterStore.stormwaterData).length) {
    value = StormwaterStore.stormwaterData.Accounts.length;
  }
  return value;
})

// const stormwaterParcelData = computed(() => {
//   let data;
//   if (StormwaterStore.stormwaterData.Parcel && Object.keys(StormwaterStore.stormwaterData.Parcel).length) {
//     data = StormwaterStore.stormwaterData.Parcel
//   }
//   return data;
// })

// const hasNoCapData = computed(() => {
//   return !Object.keys(StormwaterStore.stormwaterCapData).length;
// });

const vertTableData = computed(() => {
  // if (import.meta.env.VITE_DEBUG) console.log('stormwaterData:', stormwaterData);
  if (stormwaterData.value) {
    return [
      {
        label: 'ParcelID',
        value: stormwaterData.value.Parcel.ParcelID,
      },
      {
        label: 'Address',
        value: stormwaterData.value.Parcel.Address,
      },
      {
        label: 'Building Type',
        value: stormwaterData.value.Parcel.BldgType,
      },
      {
        label: 'Gross Area',
        value: thousandsPlace(stormwaterData.value.Parcel.GrossArea) + ' sq ft',
      },
      {
        label: 'Impervious Area',
        value: thousandsPlace(stormwaterData.value.Parcel.ImpervArea) + ' sq ft',
      },
      // {
      //   label: 'CAP Eligible',
      //   value: stormwaterParcelData.value.CAP.Eligible,
      // }
    ]
  } else {
    return []
  }
})

const accountsTableData = computed(() => {
  return {
    columns: [
    {
        label: 'Account #',
        field: 'AccountNumber',
      },
      {
        label: 'Customer',
        field: 'CustomerName',
      },
      // {
      //   label: 'Status',
      //   field: 'StormwaterStatus'
      // },
      {
        label: 'Service Type',
        field: 'ServiceTypeLabel',
      },
      {
        label: 'Size',
        field: 'MeterSize',
      },
      {
        label: 'Stormwater',
        field: 'StormwaterStatus'
      },
    ],
    rows: accounts.value || [],
  }
})

</script>

<template>
  <div
    id="Stormwater-description"
    class="topic-info"
  >
    Stormwater billing accounts associated with your search address. 
    The property boundaries displayed on the map for reference only
    and may not be used in place of recorded deeds or land surveys. 
    Boundaries are generalized for ease of visualization. 
    Source: Philadelphia Water Department
  </div>

  <div class="data-section">
    <h2 class="subtitle mb-3 is-5 vert-table-title">
      Parcel
      <font-awesome-icon
        v-if="StormwaterStore.loadingStormwaterData"
        icon="fa-solid fa-spinner"
        spin
      />
    </h2>
    <div v-if="StormwaterStore.loadingStormwaterData">
      <p>
        Loading stormwater data... <font-awesome-icon
          icon="fa-solid fa-spinner"
          spin
        />
      </p>
    </div>
    <!-- <div v-else-if="hasNoCapData">
      <p>Cannot currently find stormwater data for this address.</p>
    </div> -->
    <vertical-table
      table-id="stormwaterTable"
      :data="vertTableData"
    />
  </div>

  <h2 class="subtitle mb-3 is-5 table-title">
    Accounts
    <font-awesome-icon
      v-if="StormwaterStore.loadingStormwaterData"
      icon="fa-solid fa-spinner"
      spin
    />
    <span v-else>({{ accountsLength }})</span>
  </h2>
  <div
    v-if="accountsTableData.rows"
    class="horizontal-table"
  >
    <vue-good-table
      id="accounts"
      :columns="accountsTableData.columns"
      :rows="accountsTableData.rows"
      :pagination-options="paginationOptions(accountsTableData.rows.length)"
      style-class="table"
    >
      <template #emptystate>
        <div v-if="StormwaterStore.loadingStormwaterData">
          Loading accounts... <font-awesome-icon
            icon="fa-solid fa-spinner"
            spin
          />
        </div>
        <div v-else>
          No accounts found
        </div>
      </template>
      <template #pagination-top="props">
        <custom-pagination-labels
          :mode="'pages'"
          :total="props.total"
          :per-page="5"
          @page-changed="props.pageChanged"
          @per-page-changed="props.perPageChanged"
        />
      </template>
    </vue-good-table>
  </div>
  <a
    class="table-link"
    target="_blank"
    :href="`https://stormwater.phila.gov/parcelviewer/parcel/${parcelId}`"
  >See more at Stormwater Billing <font-awesome-icon icon="fa-solid fa-external-link" /></a>
</template>

<style>

@media 
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {

  #accounts {

    td:nth-of-type(4) {
      min-height: 60px;
    }

    td:nth-of-type(1):before { content: "Account #"; }
    td:nth-of-type(2):before { content: "Customer"; }
    td:nth-of-type(3):before { content: "Status"; }
    td:nth-of-type(4):before { content: "Service Type"; }
    td:nth-of-type(5):before { content: "Size"; }
    td:nth-of-type(6):before { content: "Stormwater"; }

  }

}

</style>