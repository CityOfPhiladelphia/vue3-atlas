<script setup>
import { computed } from 'vue';
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();

const eagleviewParcelsOn = computed(() => {
  return MapStore.eagleviewParcelsOn;
});

const toggleParcels = () => {
  console.log('toggleParcels is running, eagleviewParcelsOn:', MapStore.eagleviewParcelsOn);
  MapStore.eagleviewParcelsOn = !MapStore.eagleviewParcelsOn;
};

</script>

<template>
  <button
    class="eagleview-parcels-toggle"
    :class="eagleviewParcelsOn ? 'active' : 'inactive'"
    :title="eagleviewParcelsOn ? 'Turn parcels off' : 'Turn parcels on'"
    type="button"
    @click="toggleParcels"
  >
    Toggle Parcels
  </button>
</template>

<style scoped>

.active {
  background-color: rgb(243, 198, 19) !important;
}

button {
  background-color: transparent;
  border: none;
  cursor: pointer;
}

.eagleview-parcels-toggle {
  height: 60px;
  width: 60px;
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
  background-color: white;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  border-color: rgb(167, 166, 166);
}

</style>
