import { defineStore, acceptHMRUpdate } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import axios from 'axios';

export const useCondosStore = defineStore('CondosStore', {
  state: () => {
    return {
      condosData: {
        page_count: 0,
        total_size: 0,
        pages: {
          page_1: { features: [] },
        },
      },
      dataPageFilled: null,
      lastPageUsed: 1,
      loadingCondosData: false,
    };
  },
  actions: {
    async fillCondoData(address, page = 1) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillCondoData is running, address', address, 'page:', page);
      try {
        const GeocodeStore = useGeocodeStore();
        const AddressLoaded = GeocodeStore.aisData.features
        if (!AddressLoaded) { return }
        const aisData = AddressLoaded[0];
        let params = {
          include_units: true,
          opa_only: true,
          page: page,
        };
        const response = await axios(`https://api.phila.gov/ais/v1/search/${encodeURIComponent(address)}`, { params });
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('condos response:', response);
        if (response.status === 200) {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Condos - await resolved and HTTP status is successful')
          this.dataPageFilled = page;
          if (response.data.features.length > 0) {
            let newData = {
              // page_count: response.data.page_count,
              // total_size: response.data.total_size,
              features: [],
            }
            // if (import.meta.env.VITE_DEBUG == 'true') console.log('in condo-list, data:', data, 'state:', state);
            for (let feature of response.data.features) {
              if (import.meta.env.VITE_DEBUG == 'true') console.log('feature.properties.address_low_frac:', feature.properties.address_low_frac, 'aisData.properties.address_low_frac:', aisData.properties.address_low_frac, 'feature.properties.street_address:', feature.properties.street_address, 'aisData.properties.street_address:', aisData.properties.street_address);
              if (feature.properties.address_low_frac !== aisData.properties.address_low_frac || feature.properties.street_address === aisData.properties.street_address) {
                // return;
                response.data.total_size = response.data.total_size - 1;
              } else {
                newData.features.push(feature);
              }
            }
            if (page === 1) {
              this.condosData.page_count = response.data.page_count;
              this.condosData.total_size = response.data.total_size;
            }
            this.condosData.pages['page_'+page] = newData;
          }
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Condos - await resolved but no data features')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('Condos - await never resolved, failed to fetch condo data')
      }
    },
  }
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCondosStore, import.meta.hot))
};