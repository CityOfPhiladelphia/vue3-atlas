<script setup>
import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore.js'
const MapStore = useMapStore();

import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

import { computed } from 'vue';

const imgSrc = computed(() => {
  return MainStore.publicPath + 'images/cyclomedia.png';
});

const cyclomediaOn = computed(() => {
  return MapStore.cyclomediaOn;
});

const toggleCyclomedia = () => {
  let startQuery = { ...route.query };
  if (import.meta.env.VITE_DEBUG) console.log('startQuery:', startQuery);
  if (cyclomediaOn.value) {
    delete startQuery['streetview'];
    router.push({ query: { ...startQuery }});
  } else {
    delete startQuery['obliqueview'];
    router.push({ query: { ...startQuery, 'streetview': !cyclomediaOn.value } });
  }
};

</script>

<template>
  <div
    class="cyclomedia-toggle"
    :class="cyclomediaOn ? 'active' : 'inactive'"
    :title="cyclomediaOn ? 'Turn off street view' : 'Turn on street view'"
  >
    <button
      type="button"
      @click="toggleCyclomedia"
    >
    <!-- @click="$emit('toggleCyclomedia')" -->
      <img
        class="img-src"
        alt="street-view"
        :src="imgSrc"
      >
    </button>
  </div>
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

.cyclomedia-toggle {
  height: 36px;
  width: 36px;
  position: absolute;
  top: 94px;
  right: 10px;
  z-index: 2;
  background-color: white;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  border-color: rgb(167, 166, 166)
}

.img-src {
  max-width: 300%;
  width: 23px;
  height: 29px;
  margin-left: -1px;
}

@media 
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {

  @supports (-webkit-touch-callout: none) {
    /* CSS specific to iOS devices */ 
    .img-src {
      margin-left: -7px !important;
    }
  }
}

</style>