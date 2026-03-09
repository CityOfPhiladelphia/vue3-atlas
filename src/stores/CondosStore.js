import { defineStore } from 'pinia';
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
            if (page === 1) {
              this.condosData.page_count = response.data.page_count;
              this.condosData.total_size = response.data.total_size;
            }
            this.condosData.pages['page_'+page] = { features: response.data.features };
          }
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Condos - await resolved but no data features')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('Condos - await never resolved, failed to fetch condo data')
      }
    },
  }
})