<script setup>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { point, featureCollection } from '@turf/helpers';

import { useNearbyActivityStore } from '@/stores/NearbyActivityStore';
const NearbyActivityStore = useNearbyActivityStore();
import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();

import useTransforms from '@/composables/useTransforms';
const { timeReverseFn } = useTransforms();
import useScrolling from '@/composables/useScrolling';
const { handleRowClick, handleRowMouseover, handleRowMouseleave } = useScrolling();

import bbox from '@turf/bbox';
import buffer from '@turf/buffer';

const loadingData = computed(() => NearbyActivityStore.loadingData );

const props = defineProps({
  timeIntervalSelected: {
    type: String,
    default: '30',
  },
  textSearch: {
    type: String,
    default: '',
  },
})

const nearbyCrimeIncidents = computed(() => {
  let data;
  if (NearbyActivityStore.nearbyCrimeIncidents && NearbyActivityStore.nearbyCrimeIncidents.rows) {
    data = [ ...NearbyActivityStore.nearbyCrimeIncidents.rows]
      .filter(item => {
      let timeDiff = new Date() - new Date(item.dispatch_date);
      let daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff <= props.timeIntervalSelected;
    }).filter(item => {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('item.address:', item.address, 'props.textSearch:', props.textSearch);
      return item.location_block.toLowerCase().includes(props.textSearch.toLowerCase()) || item.text_general_code.toLowerCase().includes(props.textSearch.toLowerCase());
    })
    data.sort((a, b) => timeReverseFn(a, b, 'dispatch_date'))
  }
  return data;
});
const nearbyCrimeIncidentsGeojson = computed(() => {
  if (!nearbyCrimeIncidents.value) return featureCollection();
  return nearbyCrimeIncidents.value.map(item => point([item.lng, item.lat], { id: item.objectid, type: 'nearbyCrimeIncidents' }));
})
watch (() => nearbyCrimeIncidentsGeojson.value, (newGeojson) => {
  const map = MapStore.map;
  if (map.getSource) map.getSource('nearbyActivity').setData(featureCollection(newGeojson));
  if (newGeojson.length > 0) {
    const bounds = bbox(buffer(featureCollection(newGeojson), 1000, {units: 'feet'}));
    if (map.fitBounds) map.fitBounds(bounds);
  }
});

const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });

onMounted(() => {
  const map = MapStore.map;
  if (!NearbyActivityStore.loadingData && nearbyCrimeIncidentsGeojson.value.length > 0) {
    map.getSource('nearbyActivity').setData(featureCollection(nearbyCrimeIncidentsGeojson.value));
    if (nearbyCrimeIncidentsGeojson.value.length > 0) {
      const bounds = bbox(buffer(featureCollection(nearbyCrimeIncidentsGeojson.value), 1000, {units: 'feet'}));
      if (map.fitBounds) map.fitBounds(bounds);
    }
  }
});
onBeforeUnmount(() => {
  const map = MapStore.map;
  if (map.getSource('nearbyActivity')) { map.getSource('nearbyActivity').setData(featureCollection([point([0,0])])) }
});

const nearbyCrimeIncidentsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'dispatch_date',
        type: 'date',
        dateInputFormat: "yyyy-MM-dd",
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'Location',
        field: 'location_block',
      },
      {
        label: 'Description',
        field: 'text_general_code',
      },
      {
        label: 'Distance',
        field: 'distance_ft',
        sortFn: (x, y) => {
          const xSplit = parseInt(x.split(' ')[0]);
          const ySplit = parseInt(y.split(' ')[0]);
          return (xSplit < ySplit ? -1 : (xSplit > ySplit ? 1 : 0));
        },
      },
    ],
    rows: nearbyCrimeIncidents.value || [],
  }
});

</script>

<template>
  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Crime Incidents
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearbyCrimeIncidentsTableData.rows.length }})</span>
    </h2>
    <div class="horizontal-table">
      <vue-good-table
        id="nearbyCrimeIncidents"
        :columns="nearbyCrimeIncidentsTableData.columns"
        :rows="nearbyCrimeIncidentsTableData.rows"
        :row-style-class="row => hoveredStateId === row.objectid ? 'active-hover ' + row.objectid : 'inactive ' + row.objectid"
        style-class="table nearby-table"
        :sort-options="{ initialSortBy: {field: 'distance_ft', type: 'asc'}}"
        @row-mouseenter="handleRowMouseover($event, 'objectid')"
        @row-mouseleave="handleRowMouseleave"
        @row-click="handleRowClick($event, 'objectid', 'nearbyCrimeIncidents')"
      >
        <template #emptystate>
          <div v-if="loadingData">
            Loading nearby crime incidents... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else>
            No nearby crime incidents found for the selected time interval
          </div>
        </template>
      </vue-good-table>
    </div>
    <a
      class="table-link"
      target="_blank"
      href="https://www.phillypolice.com/crime-data/crime-statistics/"
    >See citywide crime statistics at PhillyPolice.com <font-awesome-icon icon="fa-solid fa-external-link" /></a>
  </div>
</template>

<style>

@media 
only screen and (max-width: 768px) {
	/*Label the data*/

  #nearbyCrimeIncidents {
    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "Location"; }
    td:nth-of-type(3):before { content: "Description"; }
    td:nth-of-type(4):before { content: "Distance"; }
  }
}

</style>