<script setup>

import { computed, watch } from 'vue';
import { point, featureCollection } from '@turf/helpers';
import bbox from '@turf/bbox';
import buffer from '@turf/buffer';

import maplibregl from 'maplibre-gl';

import { useGeocodeStore } from '@/stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();
import { useCityServicesStore } from '@/stores/CityServicesStore';
const CityServicesStore = useCityServicesStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();
import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();

import useScrolling from '@/composables/useScrolling';
const { handleRowClick, handleRowMouseover, handleRowMouseleave } = useScrolling();

import VerticalTable from '@/components/VerticalTable.vue';

const loadingData = computed(() => CityServicesStore.loadingData );

const nearbyFireStations = computed(() => {
  return CityServicesStore.nearbyFireStations;
})

const nearbyFireStationsGeojson = computed(() => {
  if (!nearbyFireStations.value) return null;
  return nearbyFireStations.value.map(item => point(item.geometry.coordinates, { id: item.id, type: 'nearbyFireStations' }));

})

watch(() => nearbyFireStationsGeojson.value, (newGeojson) => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('watch nearbyFireStationsGeojson.value, newGeojson:', newGeojson);
  const map = MapStore.map;
  const feat = featureCollection(newGeojson);
  if (map.getSource) map.getSource('cityServices').setData(feat);
  const bounds = bbox(buffer(feat, 2000, {units: 'feet'}));
  map.fitBounds(bounds);
});

const nearbyFireStationsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Station',
        field: 'properties.stationInfo',
        html: true,
      },
      {
        label: 'Distance',
        field: 'properties.distance_mi',
      },
    ],
    rows: nearbyFireStations.value || [],
  }
});

</script>

<template>

  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Nearby Fire Stations
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearbyFireStationsTableData.rows.length }})</span>
    </h2>
  </div>

  <vue-good-table
    id="nearbyFireStations"
    :columns="nearbyFireStationsTableData.columns"
    :rows="nearbyFireStationsTableData.rows"
    :row-style-class="row => hoveredStateId === row.id ? 'active-hover ' + row.id : 'inactive ' + row.id"
    style-class="table nearby-table"
    :sort-options="{ initialSortBy: {field: 'properties.distance_mi', type: 'asc'}}"
    @row-mouseenter="handleRowMouseover($event, 'id')"
    @row-mouseleave="handleRowMouseleave"
    @row-click="handleRowClick($event, 'id', 'nearbyFireStations')"
  >
    <template #emptystate>
      <div v-if="loadingData">
        Loading nearby fire stations... <font-awesome-icon
          icon="fa-solid fa-spinner"
          spin
        />
      </div>
      <div v-else-if="CityServicesStore.dataError">
        Data loading error - try refreshing the page
      </div>
      <div v-else>
        No nearby fire stations found
      </div>
    </template>
  </vue-good-table>

</template>