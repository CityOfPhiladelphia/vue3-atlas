import { defineStore, acceptHMRUpdate } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'

export const useStormwaterStore = defineStore('StormwaterStore', {
  state: () => {
    return {
      stormwaterData: {},
      // stormwaterCapData: {},
      loadingStormwaterData: true,
    };
  },
  actions: {
    async clearAllStormwaterData() {
      this.loadingStormwaterData = true;
      this.stormwaterData = {};
      // this.stormwaterCapData = {};
    },
    async fillStormwaterData() {
      try {
        const GeocodeStore = useGeocodeStore();
        const streetAddress = GeocodeStore.aisData.features[0].properties.street_address;
        const response = await fetch(`https://stormwater.phila.gov/PwdWebApi/api/v1/search/?q=${streetAddress}`);
        if (response.ok) {
          const data = await response.json()
          this.stormwaterData = data[0]
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('stormwaterData - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('stormwaterData - await never resolved, failed to fetch data')
      }
    },
    // async fillStormwaterCapData() {
    //   try {
    //     const GeocodeStore = useGeocodeStore();
    //     const pwdParcelId = GeocodeStore.aisData.features[0].properties.pwd_parcel_id;
    //     const response = await fetch(`https://stormwater.phila.gov/PwdWebApi/api/v1/parcel/${pwdParcelId}/cap`);
    //     if (response.ok) {
    //       const data = await response.json()
    //       this.stormwaterCapData = data[0]
    //     } else {
    //       if (import.meta.env.VITE_DEBUG == 'true') console.warn('stormwaterCapData - await resolved but HTTP status was not successful')
    //     }
    //   } catch {
    //     if (import.meta.env.VITE_DEBUG == 'true') console.error('stormwaterCapData - await never resolved, failed to fetch data')
    //   }
    // }
  }
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStormwaterStore, import.meta.hot))
};