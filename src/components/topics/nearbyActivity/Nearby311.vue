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

const nearby311 = computed(() => {
  let data;
  if (NearbyActivityStore.nearby311.rows) {
    data = [ ...NearbyActivityStore.nearby311.rows]
      .filter(item => {
      let timeDiff = new Date() - new Date(item.requested_datetime);
      let daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff <= props.timeIntervalSelected;
    }).filter(item => {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('item.address:', item.address, 'textSearch.value:', textSearch.value);
      return item.address.toLowerCase().includes(props.textSearch.toLowerCase())
      || item.service_name.toLowerCase().includes(props.textSearch.toLowerCase());
    });
    data.sort((a, b) => timeReverseFn(a, b, 'requested_datetime'))
  }
  return data;
});
const nearby311Geojson = computed(() => {
  if (!nearby311.value) return featureCollection();
  return nearby311.value.map(item => point([item.lng, item.lat], { id: item.service_request_id, type: 'nearby311' }));
})
watch (() => nearby311Geojson.value, async(newGeojson) => {
  if (import.meta.env.VITE_DEBUG) console.log('watch nearby311.value, newGeojson:', newGeojson);
  const map = MapStore.map;
  if (map.getSource) map.getSource('nearbyActivity').setData(featureCollection(newGeojson));
  if (import.meta.env.VITE_DEBUG) console.log('newGeojson:', newGeojson);
  if (newGeojson.length) {
    const bounds = bbox(buffer(featureCollection(newGeojson), 1000, {units: 'feet'}));
    if (map.fitBounds) map.fitBounds(bounds);
  }
});

const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });

onMounted(() => {
  const map = MapStore.map;
  if (!NearbyActivityStore.loadingData && nearby311Geojson.value.length > 0) {
    map.getSource('nearbyActivity').setData(featureCollection(nearby311Geojson.value));
    if (nearby311Geojson.value.length > 0) {
      const bounds = bbox(buffer(featureCollection(nearby311Geojson.value), 1000, {units: 'feet'}));
      if (map.fitBounds) map.fitBounds(bounds);
    }
  }
});
onBeforeUnmount(() => {
  const map = MapStore.map;
  if (map.getSource('nearbyActivity')) { map.getSource('nearbyActivity').setData(featureCollection([point([0,0])])) }
});

const nearby311TableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'requested_datetime',
        type: 'date',
        dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'Location',
        field: 'address',
      },
      {
        label: 'Type',
        field: 'link',
        html: true,
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
    rows: nearby311.value || [],
  }
});

</script>

<template>
  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      311 Requests
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearby311TableData.rows.length }})</span>
    </h2>
    <div class="horizontal-table">
      <vue-good-table
        id="nearby311"
        :columns="nearby311TableData.columns"
        :rows="nearby311TableData.rows"
        :row-style-class="row => hoveredStateId === row.service_request_id ? 'active-hover ' + row.service_request_id : 'inactive ' + row.service_request_id"
        style-class="table nearby-table"
        :sort-options="{ initialSortBy: {field: 'distance_ft', type: 'asc'}}"
        @row-mouseenter="handleRowMouseover($event, 'service_request_id')"
        @row-mouseleave="handleRowMouseleave"
        @row-click="handleRowClick($event, 'service_request_id', 'nearby311')"
      >
        <template #emptystate>
          <div v-if="loadingData">
            Loading nearby 311... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else-if="NearbyActivityStore.dataError">
            Data loading error - try refreshing the page
          </div>
          <div v-else>
            No nearby 311 service requests found for the selected time interval
          </div>
        </template>
      </vue-good-table>
    </div>
    <a
      class="table-link"
      target="_blank"
      href="https://iframe.publicstuff.com/#?client_id=242"
    >See citywide 311 requests submitted online or submit a service request at Philly311 <font-awesome-icon icon="fa-solid fa-external-link" /></a>
  </div>
</template>

<style>

@media
only screen and (max-width: 768px) {

	/*Label the data*/

  #nearby311 {
    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "Location"; }
    td:nth-of-type(3):before { content: "Type"; }
    td:nth-of-type(4):before { content: "Distance"; }
  }
}

</style>