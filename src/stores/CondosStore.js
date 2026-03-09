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
      searchTerm: '',
      searchActive: false,
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
            // Remove all features that share an OPA account number with another feature
            const opaCounts = {};
            for (const f of response.data.features) {
              const opa = f.properties.opa_account_num;
              opaCounts[opa] = (opaCounts[opa] || 0) + 1;
            }
            let features = response.data.features.filter(f => opaCounts[f.properties.opa_account_num] === 1);
            // If only 1 feature remains and it's the searched address itself, exclude it
            if (features.length === 1 && features[0].properties.street_address === aisData.properties.street_address) {
              features = [];
            }
            const duplicatesRemoved = response.data.features.length - features.length;
            if (page === 1) {
              this.condosData.page_count = response.data.page_count;
              this.condosData.total_size = response.data.total_size - duplicatesRemoved;
            }
            this.condosData.pages['page_'+page] = { features };
          }
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Condos - await resolved but no data features')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('Condos - await never resolved, failed to fetch condo data')
      }
    },
    async fetchAllPages() {
      const GeocodeStore = useGeocodeStore();
      const features = GeocodeStore.aisData.features;
      if (!features || !features.length) return;
      const address = features[0].properties.street_address;
      const totalPages = this.condosData.page_count;
      if (totalPages <= 1) return;
      this.loadingCondosData = true;
      try {
        for (let i = 2; i <= totalPages; i++) {
          if (!this.condosData.pages['page_' + i]) {
            await this.fillCondoData(address, i);
          }
        }
      } finally {
        this.loadingCondosData = false;
      }
    },
    async submitSearch(term) {
      if (!term.trim()) {
        this.clearSearch();
        return;
      }
      this.searchTerm = term.trim();
      await this.fetchAllPages();
      this.searchActive = true;
    },
    clearSearch() {
      this.searchTerm = '';
      this.searchActive = false;
    },
  }
})