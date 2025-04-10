import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMapStore } from '@/stores/MapStore.js'

import axios from 'axios';

export const useNearbyFacilitiesStore = defineStore('NearbyFacilitiesStore', {
  state: () => {
    return {
      dataError: false,
      loadingData: true,
    }
  },
  actions: {
    setDataError(error) {
      this.dataError = error;
    },
    setLoadingData(loading) {
      this.loadingData = loading;
    },
    async clearAllNearbyFacilitiesData() {
      this.dataError = false;
      this.loadingData = true;
    },
    async fetchData() {
      this.setLoadingData(false);
    },
  },
});
