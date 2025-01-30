<script setup>
import { ref, onMounted, watch } from 'vue';
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();
import { useGeocodeStore } from '@/stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();

import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

import $config from '@/config';

import { format, subYears } from 'date-fns';

import proj4 from 'proj4';
const projection4326 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
const projection2272 = "+proj=lcc +lat_1=40.96666666666667 +lat_2=39.93333333333333 +lat_0=39.33333333333334 +lon_0=-77.75 +x_0=600000 +y_0=0 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs";

const cyclomediaInitialized = ref(false);

const $emit = defineEmits(['updateCameraYaw', 'updateCameraLngLat', 'updateCameraHFov']);

watch(
  () => MapStore.currentAddressCoords,
  newLngLat => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue watch cyclomediaLngLat, newLngLat:', newLngLat);
    setNewLocation(newLngLat);
  }
)

watch(
  () => MapStore.cyclomediaOn,
  newCyclomediaOn => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue watch cyclomediaOn, newCyclomediaOn:', newCyclomediaOn);
    if (newCyclomediaOn) {
      if (MapStore.currentAddressCoords.length) {
        setNewLocation(MapStore.currentAddressCoords);
      } else {
        setNewLocation($config.cityCenterCoords);
      }
    }
  }
)

const navBarExpanded = ref(false);

const setNewLocation = async (coords) => {
  if (MapStore.cyclomediaOn) {

    const today = new Date();
    const year = MapStore.cyclomediaYear;
    let thisYear, lastYear;
    let params = {};
    const coords2272 = proj4(projection4326, projection2272, coords);
    if (year) {
      lastYear = `${year}-01-01`;
      thisYear = `${year + 1}-01-01`;
      params = {
        coordinate: coords,
        dateRange: { from: lastYear, to: thisYear },
      };
    } else {
      // lastYear = format(subYears(today, 2), 'yyyy-MM-dd');
      // thisYear = format(today, 'yyyy-MM-dd');
      params = {
        coordinate: coords,
      };
    }
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue setNewLocation, lastYear:', lastYear, 'thisYear:', thisYear, 'coords:', coords, 'coords2272:', coords2272);
    const response = await StreetSmartApi.open(
      params,
      {
        viewerType: StreetSmartApi.ViewerType.PANORAMA,
        srs: 'EPSG:4326',
        panoramaViewer: {
          closable: false,
          maximizable: false,
        },
      }
    )
    let viewer = response[0];
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue setNewLocation, viewer:', viewer, 'response:', response);
    viewer.toggleNavbarExpanded(navBarExpanded.value);
    viewer.toggleButtonEnabled('panorama.elevation', false);
    viewer.toggleButtonEnabled('panorama.reportBlurring', false);

    for (let overlay of viewer.props.overlays) {
      if (overlay.id === 'surfaceCursorLayer') {
        if (overlay.visible === true) {
          viewer.toggleOverlay(overlay);
        }
      }
    }

    viewer.on('VIEW_CHANGE', function(e) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('on VIEW_CHANGE fired, type:', e.type, 'detail:', e.detail, 'viewer.props:', viewer.props, 'viewer.props.orientation.xyz:', viewer.props.orientation.xyz, 'MapStore.cyclomediaCameraXyz:', MapStore.cyclomediaCameraXyz);
      if (MapStore.cyclomediaOn) {
        MapStore.cyclomediaCameraYaw = e.detail.yaw;
        MapStore.cyclomediaCameraHFov = e.detail.hFov;
        $emit('updateCameraYaw', e.detail.yaw);
        $emit('updateCameraHFov', e.detail.hFov, e.detail.yaw);
        if (viewer.props.orientation.xyz !== MapStore.cyclomediaCameraXyz) {
          // const lngLat = proj4(projection2272, projection4326, [ viewer.props.orientation.xyz[0], viewer.props.orientation.xyz[1] ]);
          const lngLat = [ viewer.props.orientation.xyz[0], viewer.props.orientation.xyz[1] ];
          MapStore.setCyclomediaCameraLngLat(lngLat, viewer.props.orientation.xyz);
          $emit('updateCameraLngLat', lngLat);
        }
      }
    });

    viewer.on('VIEW_LOAD_END', function(e) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('on VIEW_LOAD_END fired, type:', e.type, 'e:', e, 'viewer.props.orientation:', viewer.props.orientation, 'viewer.props:', viewer.props);
      if (import.meta.env.VITE_DEBUG == 'true') console.log('update cyclomedia date, viewer.props.recording.year:', viewer.props.recording.year);
      MapStore.cyclomediaYear = viewer.props.recording.year;
      // $emit('updateCyclomediaDate', e.recording.year);
      const orientation = viewer.getOrientation();
      // viewer.setOrientation({ pitch: 0 });
      if (import.meta.env.VITE_DEBUG == 'true') console.log('orientation:', orientation);
      if (viewer.props.orientation.xyz !== MapStore.cyclomediaCameraXyz) {
        // const lngLat = proj4(projection2272, projection4326, [ viewer.props.orientation.xyz[0], viewer.props.orientation.xyz[1] ]);
        const lngLat = [ viewer.props.orientation.xyz[0], viewer.props.orientation.xyz[1] ];
        MapStore.setCyclomediaCameraLngLat(lngLat, viewer.props.orientation.xyz);
        $emit('updateCameraLngLat', lngLat);
        const orientation = viewer.getOrientation();
        if (import.meta.env.VITE_DEBUG == 'true') console.log('orientation:', orientation);
        $emit('updateCameraYaw', orientation.yaw);
        $emit('updateCameraHFov', orientation.hFov, orientation.yaw);
      }
    });

    if (!MapStore.currentAddressCoords.length) {
      $emit('updateCameraLngLat', coords);
    }
    const orientation = viewer.getOrientation();
    $emit('updateCameraYaw', orientation.yaw);
    $emit('updateCameraHFov', orientation.hFov, orientation.yaw);
  }
}

watch(
  () => MapStore.clickedCyclomediaRecordingCoords,
  newClickedCyclomediaRecordingCoords => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue watch clickedCyclomediaRecordingCoords, newClickedCyclomediaRecordingCoords:', newClickedCyclomediaRecordingCoords);
    if (newClickedCyclomediaRecordingCoords) {
      setNewLocation(newClickedCyclomediaRecordingCoords);
    }
  }
)

onMounted( async() => {
  let CYCLOMEDIA_USERNAME, CYCLOMEDIA_PASSWORD;
  if (import.meta.env.VITE_VERSION == 'atlas') {
    CYCLOMEDIA_USERNAME = import.meta.env.VITE_CYCLOMEDIA_USERNAME;
    CYCLOMEDIA_PASSWORD = import.meta.env.VITE_CYCLOMEDIA_PASSWORD;
  } else if (import.meta.env.VITE_VERSION == 'cityatlas') {
    CYCLOMEDIA_USERNAME = import.meta.env.VITE_CITYATLAS_CYCLOMEDIA_USERNAME;
    CYCLOMEDIA_PASSWORD = import.meta.env.VITE_CITYATLAS_CYCLOMEDIA_PASSWORD;
  }
  if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue onMounted, StreetSmartApi:', StreetSmartApi, 'CYCLOMEDIA_USERNAME:', CYCLOMEDIA_USERNAME, 'CYCLOMEDIA_PASSWORD:', CYCLOMEDIA_PASSWORD);

  if (!cyclomediaInitialized.value) {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue onMounted, initializing cyclomedia');
    await StreetSmartApi.init({
      targetElement: cycloviewer,
      username: CYCLOMEDIA_USERNAME,
      password: CYCLOMEDIA_PASSWORD,
      apiKey: import.meta.env.VITE_CYCLOMEDIA_API_KEY,
      srs: 'EPSG:4326',
      locale: 'en-us',
      addressSettings: {
        locale: 'en-us',
        database: 'CMDatabase',
      },
    })
    if (import.meta.env.VITE_DEBUG == 'true') console.log('CyclomediaPanel.vue onMounted, cyclomedia initialized');
    cyclomediaInitialized.value = true;
  }
  if (GeocodeStore.aisData.features) {
    setNewLocation(GeocodeStore.aisData.features[0].geometry.coordinates);
  } else {
    setNewLocation([ -75.163471, 39.953338 ]);
  }
})

const popoutClicked = () => {
  window.open('//cyclomedia.phila.gov/?lat=' + MapStore.cyclomediaCameraLngLat[1] + '&lng=' + MapStore.cyclomediaCameraLngLat[0], '_blank');
  let startQuery = { ...route.query };
  delete startQuery['streetview'];
  router.push({ query: { ...startQuery }});
}

</script>

<template>
  <div class="cyclomedia-panel">

    <div class="cyclomedia-pop-out">
      <font-awesome-icon
        icon="fa-external-link-alt"
        @click="popoutClicked"
      ></font-awesome-icon>
    </div>
    <div
      id="cycloviewer"
      ref="cycloviewer"
      class="panoramaViewerWindow"
    >
    </div>

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

@media 
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {
  .cyclomedia-panel {
    height: 250px;
  }
}

.panoramaViewerWindow {
  display: block;
  width: 100%;
  height:100%;
}

</style>