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
  return nearbyRecreationFacilities.value.rows.map(item => point([item.lng, item.lat], { id: item.id, type: 'nearbyRecreationFacilities' }));

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
  map.fitBounds(bounds);
});

</script>

<template>
  coming soon
</template>