<script setup>
import { computed } from 'vue';
import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();

import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

const imgSrc = computed(() => {
  return MainStore.publicPath + 'images/eagleview.png';
});

const eagleviewOn = computed(() => {
  return MapStore.eagleviewOn;
});

const toggleEagleview = () => {
  let startQuery = { ...route.query };
  if (import.meta.env.VITE_DEBUG) console.log('startQuery:', startQuery);
  if (eagleviewOn.value) {
    delete startQuery['obliqueview'];
    router.push({ query: { ...startQuery }});
  } else {
    delete startQuery['streetview'];
    router.push({ query: { ...startQuery, 'obliqueview': !eagleviewOn.value } });
  }
};

</script>

<template>
  <div
    class="eagleview-toggle"
    :class="eagleviewOn ? 'active' : 'inactive'"
    :title="eagleviewOn ? 'Turn off oblique view' : 'Turn on oblique view'"
  >
    <button
      type="button"
      @click="toggleEagleview"
    >
    <!-- @click="$emit('toggleEagleview')" -->
      <img
        class="img-src"
        alt="oblique-view"
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

.eagleview-toggle {
  height: 36px;
  width: 36px;
  position: absolute;
  top: 52px;
  right: 10px;
  z-index: 2;
  background-color: white;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  border-color: rgb(167, 166, 166);
}

.img-src {
  max-width: 300%;
  width: 25px;
  height: 29px;
  margin-left: -2px;
}

@media 
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {

  @supports (-webkit-touch-callout: none) {
    /* CSS specific to iOS devices */ 
    .img-src {
      margin-left: -8px !important;
    }
  }
}

</style>