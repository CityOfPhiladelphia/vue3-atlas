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

const nearbyConstructionPermits = computed(() => {
  let data;
  if (NearbyActivityStore.nearbyConstructionPermits) {
    data = [ ...NearbyActivityStore.nearbyConstructionPermits.rows]
      .filter(item => {
      let itemDate = new Date(item.permitissuedate);
      let now = new Date();
      let timeDiff = now - itemDate;
      let daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff <= props.timeIntervalSelected;
    }).filter(item => {
      return item.address.toLowerCase().includes(props.textSearch.toLowerCase()) || item.typeofwork.toLowerCase().includes(props.textSearch.toLowerCase());
    })
    data.sort((a, b) => timeReverseFn(a, b, 'permitissuedate'))
  }
  return data;
});
const nearbyConstructionPermitsGeojson = computed(() => {
  if (!nearbyConstructionPermits.value) return [point([0,0])];
  return nearbyConstructionPermits.value.map(item => point([item.lng, item.lat], { id: item.objectid, type: 'nearbyConstructionPermits' }));
})
watch (() => nearbyConstructionPermitsGeojson.value, (newGeojson) => {
  const map = MapStore.map;
  if (map.getSource) map.getSource('nearby').setData(featureCollection(newGeojson));
});

const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });

onMounted(() => {
  const map = MapStore.map;
  if (!NearbyActivityStore.loadingData && nearbyConstructionPermitsGeojson.value.length > 0) { map.getSource('nearby').setData(featureCollection(nearbyConstructionPermitsGeojson.value)) }
});
onBeforeUnmount(() => {
  const map = MapStore.map;
  if (map.getSource('nearby')) { map.getSource('nearby').setData(featureCollection([point([0,0])])) }
});

const nearbyConstructionPermitsTableData = computed(() => {
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
    rows: nearbyConstructionPermits.value || [],
  }
});

</script>

<template>
  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Construction Permits
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearbyConstructionPermitsTableData.rows.length }})</span>
    </h2>
    <div class="horizontal-table">
      <vue-good-table
        id="nearbyConstructionPermits"
        :columns="nearbyConstructionPermitsTableData.columns"
        :rows="nearbyConstructionPermitsTableData.rows"
        :row-style-class="row => hoveredStateId === row.objectid ? 'active-hover ' + row.objectid : 'inactive ' + row.objectid"
        style-class="table nearby-table"
        @row-mouseenter="handleRowMouseover($event, 'objectid')"
        @row-mouseleave="handleRowMouseleave"
        @row-click="handleRowClick($event, 'objectid', 'nearbyConstructionPermits')"
        :sort-options="{ initialSortBy: {field: 'distance_ft', type: 'asc'}}"
      >
        <template #emptystate>
          <div v-if="loadingData">
            Loading nearby construction permits... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else>
            No nearby construction permits found for the selected time interval
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
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {
	/*Label the data*/

  #nearbyConstructionPermits {
    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "Location"; }
    td:nth-of-type(3):before { content: "Type"; }
    td:nth-of-type(4):before { content: "Distance"; }
  }
}

</style>