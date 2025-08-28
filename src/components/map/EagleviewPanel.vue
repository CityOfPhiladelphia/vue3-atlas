<script setup>

import $config from '@/config';
import { onMounted, computed, watch } from 'vue';
import { point } from '@turf/helpers';

import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();

import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

const currentAddressCoords = computed(() => {
  if (MapStore.currentAddressCoords.length) {
    return { lat: MapStore.currentAddressCoords[1], lon: MapStore.currentAddressCoords[0] }
  } else {
    return { lat: $config.cityCenterCoords[1], lon: $config.cityCenterCoords[0] };
  }
});

let map;

const eagleviewProperties = {
  "eagleview": {
    "subType": "Marker",
    "icon": "FaMapMarkerAlt",
    "style": {
      "color": "#2c63c7",
      "size": 34,
    }
  }
};

watch(
  () => currentAddressCoords.value,
  newValue => {
    if (newValue) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('currentAddressCoords changed:', newValue);
      map.setView({ lonLat: newValue });
      map.removeFeatures();
      map.addFeatures({
        geoJson: [
          point(
            [newValue.lon, newValue.lat],
            eagleviewProperties
          )
        ]
      });
    }
  }
);

onMounted(async () => {
  if (!MapStore.eagleviewToken) {
    await router.push('/eagleviewToken')
  }

  const config = {
    authToken: MapStore.eagleviewToken,
    measurementPanelEnabled: false,
    searchBarEnabled: false,
    enableDualPaneButton: false,
    view: {
      lonLat: currentAddressCoords.value,
      zoom: 17,
      pitch: 0,
      rotation: 0
    }
  }
  map = new window.ev.EmbeddedExplorer().mount('eagleview', config);
  if (MapStore.currentAddressCoords.length) {
    map.addFeatures({
      geoJson: [
        point(
          [currentAddressCoords.value.lon, currentAddressCoords.value.lat],
          eagleviewProperties
        )
      ]
    });
  }
});

const popoutClicked = () => {
  window.open('//pictometry.phila.gov/?lat=' + MapStore.currentAddressCoords[1] + '&lng=' + MapStore.currentAddressCoords[0], '_blank');
  let startQuery = { ...route.query };
  delete startQuery['obliqueview'];
  router.push({ query: { ...startQuery } });
}

</script>

<template>
  <div class="eagleview-panel">
    <div class="eagleview-pop-out">
      <font-awesome-icon
        icon="fa-external-link"
        @click="popoutClicked"
      />
    </div>

    <div
      id="eagleview"
      class="eagleview-div"
    />
  </div>
</template>

<style>
.eagleview-panel {
  position: relative;
  height: 100%;
  width: 100%;
}

.eagleview-div {
  position: relative;
  height: 100%;
  width: 100%;
}

.eagleview-pop-out {
  position: absolute;
  right: 0;
  z-index: 2;
  background-color: white;
  padding-left: 6px;
  padding-right: 6px;
  padding-top: 1px;
  padding-bottom: 1px;
  cursor: pointer;
  border-radius: 2px;
}

@media only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px) {
  .eagleview-div {
    height: 250px;
  }
}


.ev-embedded-explorer_container {
  height: 100%;
  width: 100%;
}
</style>
