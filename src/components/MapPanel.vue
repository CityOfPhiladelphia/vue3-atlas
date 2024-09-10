<script setup>

import { useMapStore } from '@/stores/MapStore'
const MapStore = useMapStore();
import Map from '@/components/map/Map.vue';

import { computed } from 'vue';
import FullScreenMapToggleTab from '@/components/FullScreenMapToggleTab.vue';

const mapPanelClass = computed(() => {
  if (MapStore.cyclomediaOn || MapStore.eagleviewOn) {
    return 'map-panel cyclomedia-eagleview';
  } else {
    return 'map-panel';
  }
});

</script>

<template>
  <div
    id="map-panel"
    :class="mapPanelClass"
  >
    <full-screen-map-toggle-tab />
    <Map />
  </div>
</template>

<style>

</style>