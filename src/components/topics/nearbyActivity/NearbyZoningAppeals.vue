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

const nearbyZoningAppeals = computed(() => {
  let data;
  if (NearbyActivityStore.nearbyZoningAppeals) {
    data = [ ...NearbyActivityStore.nearbyZoningAppeals.rows]
    // if (import.meta.env.VITE_DEBUG == 'true') console.log(new Date(data[0].scheduleddate));
    if (props.timeIntervalSelected < 0) {
      data = data.filter(item => {
        let timeDiff = new Date() - new Date(item.scheduleddate);
        let daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        return daysDiff >= props.timeIntervalSelected;
      })
    } else if (props.timeIntervalSelected > 0) {
      data = data.filter(item => {
        let timeDiff = new Date() - new Date(item.scheduleddate);
        let daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        return daysDiff <= props.timeIntervalSelected;
      })
    }
    if (import.meta.env.VITE_DEBUG == 'true') console.log('data 1:', data);
    data = data.filter(item => {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('item.address:', item.address, 'item.appealgrounds', item.appealgrounds, 'props.textSearch:', props.textSearch, 'item.address.toLowerCase().includes(props.textSearch.toLowerCase()) || item.appealgrounds.toLowerCase().includes(props.textSearch.toLowerCase()):', item.address.toLowerCase().includes(props.textSearch.toLowerCase()) || item.appealgrounds.toLowerCase().includes(props.textSearch.toLowerCase()));
      return item.address.toLowerCase().includes(props.textSearch.toLowerCase()) || item.appealgrounds.toLowerCase().includes(props.textSearch.toLowerCase());
      // return false;
    })
    if (import.meta.env.VITE_DEBUG == 'true') console.log('data 2:', data);
    data.sort((a, b) => timeReverseFn(a, b, 'scheduleddate'))
  }
  return data;
});
const nearbyZoningAppealsGeojson = computed(() => {
  if (!nearbyZoningAppeals.value) return [point([0,0])];
  return nearbyZoningAppeals.value.map(item => point([item.lng, item.lat], { id: item.objectid, type: 'nearbyZoningAppeals' }));
})
watch (() => nearbyZoningAppealsGeojson.value, (newGeojson) => {
  const map = MapStore.map;
  if (map.getSource) map.getSource('nearby').setData(featureCollection(newGeojson));
});

const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });

onMounted(() => {
  const map = MapStore.map;
  if (!NearbyActivityStore.loadingData && nearbyZoningAppealsGeojson.value.length > 0) { map.getSource('nearby').setData(featureCollection(nearbyZoningAppealsGeojson.value)) }
});
onBeforeUnmount(() => {
  const map = MapStore.map;
  if (map.getSource('nearby')) { map.getSource('nearby').setData(featureCollection([point([0,0])])) }
});

const nearbyZoningAppealsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'scheduleddate',
        type: 'date',
        dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'Location',
        field: 'address',
      },
      {
        label: 'Description',
        field: 'appealgrounds',
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
      {
        label: 'Link',
        field: 'link',
        html: true,
      }
    ],
    rows: nearbyZoningAppeals.value || [],
  }
});

</script>

<template>
  <div class="mt-5">
    <div class="topic-info">See all at the <a target="_blank" href="https://li.phila.gov/zba-appeals-calendar">Zoning Board of Adjustment (ZBA) appeals calendar</a>.</div>
    <h2 class="subtitle mb-3 is-5">
      Zoning Appeals
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearbyZoningAppealsTableData.rows.length }})</span>
    </h2>
    <div class="horizontal-table">
      <vue-good-table
        id="nearbyZoningAppeals"
        :columns="nearbyZoningAppealsTableData.columns"
        :rows="nearbyZoningAppealsTableData.rows"
        :row-style-class="row => hoveredStateId === row.objectid ? 'active-hover ' + row.objectid : 'inactive ' + row.objectid"
        style-class="table nearby-table"
        @row-mouseenter="handleRowMouseover($event, 'objectid')"
        @row-mouseleave="handleRowMouseleave"
        @row-click="handleRowClick($event, 'objectid', 'nearbyZoningAppeals')"
        :sort-options="{ initialSortBy: {field: 'distance_ft', type: 'asc'}}"
      >
        <template #emptystate>
          <div v-if="loadingData">
            Loading nearby zoning appeals... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else>
            No nearby zoning appeals found for the selected time interval
          </div>
        </template>
      </vue-good-table>
    </div>
  </div>
</template>

<style>

@media 
only screen and (max-width: 768px){
	/*Label the data*/

  #nearbyZoningAppeals {
    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "Location"; }
    td:nth-of-type(3):before { content: "Description"; }
    td:nth-of-type(4):before { content: "Distance"; }
    td:nth-of-type(5):before { content: "Link"; }
  }
}

</style>