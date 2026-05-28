<script setup>
import { computed, ref, onMounted, watch, useTemplateRef } from "vue";
import { useMapStore } from "@/stores/MapStore";
const MapStore = useMapStore();
import { useGeocodeStore } from "@/stores/GeocodeStore";
const GeocodeStore = useGeocodeStore();

import { useRouter, useRoute } from "vue-router";
const route = useRoute();
const router = useRouter();

import { useCyclomedia } from "../../composables/cyclomedia/useCyclomedia";
const cyclomedia = useCyclomedia();

import $config from "@/config";

const cyclomediaInitialized = ref(false);
const streetView = useTemplateRef("cycloviewer");

const $emit = defineEmits([
  "updateCameraYaw",
  "updateCameraLngLat",
  "updateCameraHFov",
]);

watch(
  () => MapStore.currentAddressCoords,
  (newLngLat) => {
    if (import.meta.env.VITE_DEBUG == "true")
      console.log(
        "CyclomediaPanel.vue watch cyclomediaLngLat, newLngLat:",
        newLngLat,
      );
    setNewLocation(newLngLat);
  },
)

watch(
  () => MapStore.clickedCyclomediaRecordingCoords,
  newClickedCyclomediaRecordingCoords => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue watch clickedCyclomediaRecordingCoords, newClickedCyclomediaRecordingCoords:', newClickedCyclomediaRecordingCoords);
    if (newClickedCyclomediaRecordingCoords) {
      setNewLocation(newClickedCyclomediaRecordingCoords);
    }
  }
)

const dateRange = computed(() => {
  return MapStore.cyclomediaYear ? { from: `${MapStore.cyclomediaYear}-01-01`, to: `${MapStore.cyclomediaYear + 1}-01-01` } : undefined
})

onMounted(async () => {
  if (!cyclomediaInitialized.value) {
    if (import.meta.env.VITE_DEBUG == "true") {
      console.log("CyclomediaPanel.vue onMounted, initializing cyclomedia");
    }
    cyclomediaInitialized.value = await cyclomedia.init(streetView.value);
  }
  if (!cyclomediaInitialized.value) {
    throw new Error("Cyclomedia failed to initialize");
  }

  const coords = GeocodeStore.aisData.features ? GeocodeStore.aisData.features[0].geometry.coordinates : $config.cityCenterCoords
  const params = {
    coordinate: coords,
    dateRange: dateRange.value
  };
  if (import.meta.env.VITE_DEBUG == "true")
    console.log(
      "CyclomediaPanel.vue onMounted, lastYear:",
      params.dateRange?.from,
      "thisYear:",
      params.dateRange?.to,
      "coords:",
      coords,
    );

  const viewer = await cyclomedia.open(params);

  viewer.on("VIEW_CHANGE", function (e) {
    if (import.meta.env.VITE_DEBUG == "true")
      console.log(
        "on VIEW_CHANGE fired, type:",
        e.type,
        "detail:",
        e.detail,
        "viewer.props:",
        viewer.props,
        "viewer.props.orientation.xyz:",
        viewer.props.orientation.xyz,
        "MapStore.cyclomediaCameraXyz:",
        MapStore.cyclomediaCameraXyz,
      );

      moveCamera(viewer.props.orientation.xyz, e.detail.yaw, e.detail.hFov)
  });
});

const setNewLocation = async (coords) => {
  const params = {
    coordinate: coords,
    dateRange: dateRange.value
  };
  if (import.meta.env.VITE_DEBUG == "true")
    console.log(
      "CyclomediaPanel.vue setNewLocation, lastYear:",
      params.dateRange?.from,
      "thisYear:",
      params.dateRange?.to,
      "coords:",
      coords,
    );

  const viewer = await cyclomedia.open(params);
  const orientation = viewer.getOrientation();
  moveCamera(viewer.props.orientation.xyz, orientation.yaw, orientation.hFov)
};

const moveCamera = (xyz, yaw, fov) => {
  MapStore.cyclomediaCameraYaw = yaw;
  MapStore.cyclomediaCameraHFov = fov;

  if (xyz !== MapStore.cyclomediaCameraXyz) {
    const lngLat = [
      xyz[0],
      xyz[1],
    ];
    MapStore.setCyclomediaCameraLngLat(lngLat, xyz);
    $emit("updateCameraYaw", yaw);
    $emit("updateCameraHFov", fov, yaw);
    $emit("updateCameraLngLat", lngLat);
  }
}

const popoutClicked = () => {
  document.open(
    "//cyclomedia.phila.gov/?lat=" +
      MapStore.cyclomediaCameraLngLat[1] +
      "&lng=" +
      MapStore.cyclomediaCameraLngLat[0],
    "_blank",
  );
  let startQuery = { ...route.query };
  delete startQuery["streetview"];
  router.push({ query: { ...startQuery } });
};
</script>

<template>
  <div class="cyclomedia-panel">
    <div class="cyclomedia-pop-out">
      <font-awesome-icon
        icon="fa-external-link"
        @click="popoutClicked"
      />
    </div>
    <div
      id="cycloviewer"
      ref="cycloviewer"
      class="panoramaViewerWindow"
    />
  </div>
</template>

<style scoped>
.cyclomedia-panel {
  position: relative;
  height: 100%;
  width: 100%;
}

.cyclomedia-pop-out {
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
  .cyclomedia-panel {
    height: 250px;
  }
}

.panoramaViewerWindow {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
