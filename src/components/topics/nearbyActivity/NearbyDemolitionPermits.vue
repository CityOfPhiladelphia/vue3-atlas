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

const nearbyDemolitionPermits = computed(() => {
  let data;
  if (NearbyActivityStore.nearbyDemolitionPermits) {
    data = [ ...NearbyActivityStore.nearbyDemolitionPermits.rows]
      .filter(item => {
      let itemDate = new Date(item.permitissuedate);
      let now = new Date();
      let timeDiff = now - itemDate;
      let daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff <= props.timeIntervalSelected;
    }).filter(item => {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('item.address:', item.address, 'props.textSearch:', props.textSearch);
      return item.address.toLowerCase().includes(props.textSearch.toLowerCase()) || item.typeofwork.toLowerCase().includes(props.textSearch.toLowerCase());
    });
    data.sort((a, b) => timeReverseFn(a, b, 'permitissuedate'))
  }
  return data;
});
const nearbyDemolitionPermitsGeojson = computed(() => {
  if (!nearbyDemolitionPermits.value) return featureCollection();
  return nearbyDemolitionPermits.value.map(item => point([item.lng, item.lat], { id: item.objectid, type: 'nearbyDemolitionPermits' }));
})
watch (() => nearbyDemolitionPermitsGeojson.value, (newGeojson) => {
  const map = MapStore.map;
  if (map.getSource) map.getSource('nearbyActivity').setData(featureCollection(newGeojson));
  if (newGeojson.length) {
    const bounds = bbox(buffer(featureCollection(newGeojson), 1000, {units: 'feet'}));
    if (map.fitBounds) map.fitBounds(bounds);
  }
});

const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });

onMounted(() => {
  const map = MapStore.map;
  if (!NearbyActivityStore.loadingData && nearbyDemolitionPermitsGeojson.value.length > 0) {
    map.getSource('nearbyActivity').setData(featureCollection(nearbyDemolitionPermitsGeojson.value));
    if (nearbyDemolitionPermitsGeojson.value.length > 0) {
      const bounds = bbox(buffer(featureCollection(nearbyDemolitionPermitsGeojson.value), 1000, {units: 'feet'}));
      if (map.fitBounds) map.fitBounds(bounds);
    }
  }
});
onBeforeUnmount(() => {
  const map = MapStore.map;
  if (map.getSource('nearbyActivity')) { map.getSource('nearbyActivity').setData(featureCollection([point([0,0])])) }
});

const nearbyDemolitionPermitsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'permitissuedate',
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
        field: 'typeofwork',
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
    rows: nearbyDemolitionPermits.value || [],
  }
});

</script>

<template>
  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Demolition Permits
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearbyDemolitionPermitsTableData.rows.length }})</span>
    </h2>
    <div class="horizontal-table">
      <vue-good-table
        id="nearbyDemolitionPermits"
        :columns="nearbyDemolitionPermitsTableData.columns"
        :rows="nearbyDemolitionPermitsTableData.rows"
        :row-style-class="row => hoveredStateId === row.objectid ? 'active-hover ' + row.objectid : 'inactive ' + row.objectid"
        style-class="table nearby-table"
        @row-mouseenter="handleRowMouseover($event, 'objectid')"
        @row-mouseleave="handleRowMouseleave"
        @row-click="handleRowClick($event, 'objectid', 'nearbyDemolitionPermits')"
        :sort-options="{ initialSortBy: {field: 'distance_ft', type: 'asc'}}"
      >
        <template #emptystate>
          <div v-if="loadingData">
            Loading nearby demolition permits... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else>
            No nearby demolition permits found for the selected time interval
          </div>
        </template>
      </vue-good-table>
    </div>
    <a
      class="table-link"
      target="_blank"
      href="https://iframe.publicstuff.com/#?client_id=242"
    >Report complaints about construction or demolition activity to Philly311 <font-awesome-icon icon="fa-solid fa-external-link-alt" /></a>
  </div>
</template>

<style>

@media 
only screen and (max-width: 768px){
	/*Label the data*/

  #nearbyDemolitionPermits {
    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "Location"; }
    td:nth-of-type(3):before { content: "Type"; }
    td:nth-of-type(4):before { content: "Distance"; }
  }
}

</style>