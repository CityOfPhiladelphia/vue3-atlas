import { defineStore } from 'pinia';
import { fetchAisSearch } from '@/util/ais.js';

export const useGeocodeStore = defineStore("GeocodeStore", {
  state: () => {
    return {
      aisDataChecked: {},
      aisData: {},
    };
  },

  actions: {
    async checkAisData(parameter) {
      try {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('checkAisData is running, parameter:', parameter);
        const data = await fetchAisSearch(parameter);
        if (data) {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('check AIS - await resolved and HTTP status is successful')
          this.aisDataChecked = data
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('check AIS - await resolved but HTTP status was not successful')
          this.aisDataChecked = {}
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('check AIS - await never resolved, failed to fetch address data')
      }
    },
    async fillAisData(address) {
      try {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('Address - fillAisData is running, address:', address)
        const data = await fetchAisSearch(address);
        if (data) {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Address - await resolved and HTTP status is successful')
          this.aisData = data
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Address - await resolved but HTTP status was not successful')
          this.aisData = {}
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('Address - await never resolved, failed to fetch address data')
      }
    },
  },
  getters: {
  },

});