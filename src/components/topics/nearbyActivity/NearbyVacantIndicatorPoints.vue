<script setup>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { point, featureCollection } from '@turf/helpers';

import { useNearbyActivityStore } from '@/stores/NearbyActivityStore';
const NearbyActivityStore = useNearbyActivityStore();
import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();

import useScrolling from '@/composables/useScrolling';
const { handleRowClick, handleRowMouseover, handleRowMouseleave } = useScrolling();

const loadingData = computed(() => NearbyActivityStore.loadingData );

const props = defineProps({
  textSearch: {
    type: String,
    default: '',
  },
})

const nearbyVacantIndicatorPoints = computed(() => {
  let data;
  if (NearbyActivityStore.nearbyVacantIndicatorPoints.rows) {
    data = [ ...NearbyActivityStore.nearbyVacantIndicatorPoints.rows].filter(item => {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('item.properties.ADDRESS:', item.properties.ADDRESS, 'props.textSearch:', props.textSearch);
      return item.properties.ADDRESS.toLowerCase().includes(props.textSearch.toLowerCase()) || item.properties.VACANT_FLAG.toLowerCase().includes(props.textSearch.toLowerCase());
    });
    data.sort((a, b) => a.distance_ft - b.distance_ft)
  }
  return data;
});
const nearbyVacantIndicatorPointsGeojson = computed(() => {
  if (!nearbyVacantIndicatorPoints.value) return [point([0,0])];
  return nearbyVacantIndicatorPoints.value.map(item => point(item.geometry.coordinates, { id: item.id, type: 'nearbyVacantIndicatorPoints' }));
})
watch (() => nearbyVacantIndicatorPointsGeojson.value, (newGeojson) => {
  const map = MapStore.map;
  if (map.getSource) map.getSource('nearby').setData(featureCollection(newGeojson));
});

const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });

onMounted(() => {
  const map = MapStore.map;
  if (!NearbyActivityStore.loadingData && nearbyVacantIndicatorPointsGeojson.value.length > 0) { map.getSource('nearby').setData(featureCollection(nearbyVacantIndicatorPointsGeojson.value)) }
});
onBeforeUnmount(() => {
  const map = MapStore.map;
  if (map.getSource('nearby')) { map.getSource('nearby').setData(featureCollection([point([0,0])])) }
});

const nearbyVacantIndicatorsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Address',
        field: 'properties.ADDRESS',
      },
      {
        label: 'Property',
        field: 'properties.VACANT_FLAG',
      },
      {
        label: 'Distance',
        field: 'properties.distance_ft',
        sortFn: (x, y) => {
          const xSplit = parseInt(x.split(' ')[0]);
          const ySplit = parseInt(y.split(' ')[0]);
          return (xSplit < ySplit ? -1 : (xSplit > ySplit ? 1 : 0));
        },
      },
    ],
    rows: nearbyVacantIndicatorPoints.value || [],
  }
});

</script>

<template>
  <div class="mt-5">
    <div class="topic-info">See all <a target="_blank" href="https://phl.maps.arcgis.com/apps/webappviewer/index.html?id=64ac160773d04952bc17ad895cc00680">vacant properties</a>.</div>
    <h2 class="subtitle mb-3 is-5">
      Likely Vacant Properties
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearbyVacantIndicatorsTableData.rows.length }})</span>
    </h2>
    <div class="horizontal-table">
      <vue-good-table
        id="nearbyVacantIndicators"
        :columns="nearbyVacantIndicatorsTableData.columns"
        :rows="nearbyVacantIndicatorsTableData.rows"
        :row-style-class="row => hoveredStateId === row.id ? 'active-hover ' + row.id : 'inactive ' + row.id"
        style-class="table nearby-table"
        @row-mouseenter="handleRowMouseover($event, 'id')"
        @row-mouseleave="handleRowMouseleave"
        @row-click="handleRowClick($event, 'id', 'nearbyVacantIndicatorPoints')"
        :sort-options="{ initialSortBy: {field: 'properties.distance_ft', type: 'asc'}}"
      >
        <template #emptystate>
          <div v-if="loadingData">
            Loading nearby vacant indicators... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else>
            No nearby vacant indicators found
          </div>
        </template>
      </vue-good-table>
    </div>
  </div>
</template>

<style>

@media 
only screen and (max-width: 768px) {

  #nearbyVacantIndicators {
    td:nth-of-type(2) { min-height: 60px; }

    /*Label the data*/
    td:nth-of-type(1):before { content: "Address"; }
    td:nth-of-type(2):before { content: "Property Type"; }
    td:nth-of-type(3):before { content: "Distance"; }
  }
}

</style>