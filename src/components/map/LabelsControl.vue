<script setup>
import { computed } from 'vue';
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();

const eagleviewLabelsOn = computed(() => {
  return MapStore.eagleviewLabelsOn;
});

const toggleLabels = () => {
  console.log('toggleLabels is running, eagleviewLabelsOn:', MapStore.eagleviewLabelsOn);
  MapStore.eagleviewLabelsOn = !MapStore.eagleviewLabelsOn;
};

</script>

<template>
  <button
    class="eagleview-labels-toggle"
    :class="eagleviewLabelsOn ? 'active' : 'inactive'"
    :title="eagleviewLabelsOn ? 'Turn labels off' : 'Turn labels on'"
    type="button"
    @click="toggleLabels"
  >
    Toggle Labels
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

.eagleview-labels-toggle {
  height: 60px;
  width: 60px;
  position: absolute;
  top: 90px;
  left: 20px;
  z-index: 2;
  background-color: white;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  border-color: rgb(167, 166, 166);
}

</style>
