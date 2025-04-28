<script setup>

import { computed, watch } from 'vue';
import { point, featureCollection } from '@turf/helpers';
import bbox from '@turf/bbox';
import buffer from '@turf/buffer';

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

const loadingData = computed(() => CityServicesStore.loadingData);
const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });

const nearbyRecreationFacilities = computed(() => {
  return CityServicesStore.nearbyRecreationFacilities;
});

const nearbyRecreationFacilitiesGeojson = computed(() => {
  if (!nearbyRecreationFacilities.value) return null;
  return nearbyRecreationFacilities.value.map(item => point([item.lng, item.lat], { id: item.id, type: 'nearbyRecreationFacilities' }));
})

watch(() => nearbyRecreationFacilitiesGeojson.value, (newGeojson) => {
  const currentAddress = point(MapStore.currentAddressCoords);
  if (import.meta.env.VITE_DEBUG == 'true') console.log('watch nearbyRecreationFacilities.value, newGeojson:', newGeojson, 'currentAddress:', currentAddress);
  const map = MapStore.map;
  const feat = featureCollection(newGeojson);
  if (import.meta.env.VITE_DEBUG) console.log('watch nearbyRecreationFacilities.value, feat:', feat);
  if (map.getSource) map.getSource('cityServices').setData(feat);
  const feat2 = featureCollection([currentAddress, ...newGeojson]);
  const bounds = bbox(buffer(feat2, 2000, {units: 'feet'}));
  if (map.fitBounds) map.fitBounds(bounds);
});

const nearbyRecreationFacilitiesTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Location',
        field: 'location',
        html: true,
      },
      {
        label: 'Features',
        field: 'features',
        html: true,
      },
      {
        label: 'Distance',
        field: 'distance_mi',
      },
    ],
    rows: nearbyRecreationFacilities.value || [],
  }
});

</script>

<template>
  
  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Nearby Recreation Facilities
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearbyRecreationFacilitiesTableData.rows.length }})</span>
    </h2>
  </div>

  <vue-good-table
    id="nearbyRecreationFacilities"
    :columns="nearbyRecreationFacilitiesTableData.columns"
    :rows="nearbyRecreationFacilitiesTableData.rows"
    :row-style-class="row => hoveredStateId === row.id ? 'active-hover ' + row.id : 'inactive ' + row.id"
    style-class="table nearby-table nearby-recreation-facilities-table"
    :sort-options="{ initialSortBy: {field: 'distance_mi', type: 'asc'}}"
    @row-mouseenter="handleRowMouseover($event, 'id')"
    @row-mouseleave="handleRowMouseleave"
    @row-click="handleRowClick($event, 'id', 'nearbyRecreationFacilities')"
  >
    <template #emptystate>
      <div v-if="loadingData">
        Loading nearby recreation facilities... <font-awesome-icon
          icon="fa-solid fa-spinner"
          spin
        />
      </div>
      <div v-else-if="CityServicesStore.dataError">
        Data loading error - try refreshing the page
      </div>
      <div v-else>
        No nearby recreation facilities found
      </div>
    </template>
  </vue-good-table>

  <a
    class="table-link"
    target="_blank"
    href="https://www.phila.gov/parks-rec-finder/#/"
  >See all parks & recreation facilities citywide <font-awesome-icon icon="fa-solid fa-external-link-alt" /></a>

  

</template>

<style>

.nearby-recreation-facilities-table {
  .description {
    font-size: 0.7rem;
  }
}

</style>