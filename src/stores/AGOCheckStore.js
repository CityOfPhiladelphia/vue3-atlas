import { defineStore, acceptHMRUpdate } from 'pinia';

export const useAGOCheckStore = defineStore("AGOCheckStore", {
  state: () => {
    return {
      AGOChecked: true,
      responseTime: 0,
    };
  },

  actions: {
    async checkAGO() {
      const pwdParcelNumber = 542611;
      try {
        const start = performance.now();
        const response = await fetch(`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/PWD_PARCELS/FeatureServer/0/query?where=PARCELID=%27${pwdParcelNumber}%27&outSR=4326&f=geojson&outFields=*&returnGeometry=true`);
        if (response.ok) {
          this.AGOChecked = true;
          const end = performance.now();
          const responseTime = end - start;
          this.responseTime = responseTime;
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillPwdParcelData - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillPwdParcelData - await never resolved, failed to fetch parcel data');
      }
    },
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAGOCheckStore, import.meta.hot))
};