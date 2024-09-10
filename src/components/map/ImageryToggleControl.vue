<script setup type='ts'>
import { computed } from 'vue';
import { useMainStore } from '@/stores/MainStore'
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();

defineEmits(['toggleImagery']);

const imgSrc = computed(() => {
  if (MapStore.imageryOn) {
    return MainStore.publicPath + 'images/basemap_small.png';
    // return import.meta.env.VITE_PUBLICPATH + 'images/basemap_small.png';
    // return 'images/basemap_small.png';
  } else {
    return MainStore.publicPath + 'images/imagery_small.png';
    // return import.meta.env.VITE_PUBLICPATH + 'images/imagery_small.png';
    // return 'images/imagery_small.png';
  }
});

const imageryOn = computed(() => {
  return MapStore.imageryOn;
});

</script>

<template>
  <div class="imagery-toggle">
    <button
      type="button"
      :title="imageryOn ? 'Turn off imagery' : 'Show imagery'"
      @click="$emit('toggleImagery')"
    >
      <img
        class="img-src"
        alt="imagery-or-basemap"
        :src="imgSrc"
      >
    </button>
  </div>
</template>

<style scoped>

button {
  background-color: transparent;
  border: none;
  cursor: pointer;
}

.imagery-toggle {
  height: 36px;
  width: 36px;
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  border-color: rgb(167, 166, 166)
}

.img-src {
  margin-left: -6px;
  margin-top: -1px;
  width: 34px;
  height: 34px;
  max-width: 300%; 
}

@media 
only screen and (max-width: 760px),
(min-device-width: 768px) and (max-device-width: 1024px)  {

  @supports (-webkit-touch-callout: none) {
    /* CSS specific to iOS devices */ 
    .img-src {
      margin-left: -10px !important;
      width: 36x;
    }
  }
}

</style>