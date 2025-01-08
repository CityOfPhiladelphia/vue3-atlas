import { defineStore, acceptHMRUpdate } from 'pinia';
import buffer from '@turf/buffer';
import { point } from '@turf/helpers';

export const useMapStore = defineStore("MapStore", {
  state: () => {
    return {
      map: {},
      currentMapStyle: 'pwdDrawnMapStyle',
      currentAddressCoords: [],
      // currentTopicMapStyle: {},
      bufferForAddress: {},
      currentMarkersForTopic: [],
      addressMarker: null,
      addressParcel: null,
      initialized: false,
      draw: null,
      imageryOn: false,
      imagerySelected: '2023',
      cyclomediaOn: false,
      cyclomediaInitialized: false,
      cyclomediaRecordingsOn: false,
      cyclomediaCameraYaw: null,
      cyclomediaCameraHFov: null,
      cyclomediaCameraXyz: null,
      cyclomediaCameraLngLat: null,
      cyclomediaYear: null,
      clickedCyclomediaRecordingCoords: null,
      eagleviewOn: false,
      selectedRegmap: null,
      regmapOpacity: 0.5,
      zoningOpacity: 1,
      stormwaterOpacity: 1,
      labelLayers: [],
    };
  },
  actions: {
    setCyclomediaCameraYaw(yaw) {
      this.cyclomediaCameraYaw = yaw;
    },
    setCyclomediaCameraLngLat(lngLat, xyz) {
      this.cyclomediaCameraXyz = xyz;
      this.cyclomediaCameraLngLat = lngLat;
    },
    setMap(map) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore.setMap is running, map:', map);
      this.map = map;
    },
    setMapStyle(style) {
      this.currentMapStyle = style;
    },
    async fillBufferForAddress(lng, lat) {
      let thePoint = point([lng, lat])
      let theBuffer = buffer(thePoint, 750, {units: 'feet'});
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillBufferForAddress is running, thePoint:', thePoint, 'theBuffer:', theBuffer, 'lng:', lng, 'lat:', lat);
      this.bufferForAddress = theBuffer.geometry.coordinates;
    }
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMapStore, import.meta.hot))
};