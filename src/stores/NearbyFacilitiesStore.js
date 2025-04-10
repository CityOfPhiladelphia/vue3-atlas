import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMapStore } from '@/stores/MapStore.js'

import axios from 'axios';

export const useNearbyFacilitiesStore = defineStore('NearbyFacilitiesStore', {
  state: () => {
    return {
      dataError: false,
      loadingData: true,
      allSchools: null,
      nearbySchools: null,
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
    async fetchData(dataType) {
      if (import.meta.env.VITE_DEBUG) console.log('fetchData is running, dataType:', dataType);
      this.setLoadingData(false);
      if (dataType === 'publicSchools') {
        await this.fillNearbySchools();
      }
    },
    async fillAllSchools() {
      try {
        const params = {
          where: '1=1',
          outFields: '*',
          f: 'geojson',
        }
        const response = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Schools/FeatureServer/0/query?', { params });
        if (response.status === 200) {
          const data = response.data;
          this.allSchools = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearby311 - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearby311 - await never resolved, failed to fetch address data');
        this.setLoadingData(false);
        this.setDataError(true);
      }
    },
    async fillNearbySchools() {
      if (import.meta.env.VITE_DEBUG) console.log('fillNearbySchools is running');
    }
  },
});
