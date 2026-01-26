import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { API_SOURCES } from '@/config/apiSources.js';

import useTransforms from '@/composables/useTransforms';
const { titleCase, prettyNumber, currency, date } = useTransforms();

export const useOpaStore = defineStore('OpaStore', {
  state: () => {
    return {
      opaData: {},
      assessmentHistory: {},
      loadingOpaData: true,
    };
  },
  actions: {
    async clearAllOpaData() {
      this.loadingOpaData = true;
      this.opaData = {};
      this.assessmentHistory = {};
    },
    async fillOpaData() {
      if (API_SOURCES.opaData === 'arcgis') {
        return this._fillOpaDataArcGIS();
      }
      return this._fillOpaDataCarto();
    },
    async _fillOpaDataArcGIS() {
      try {
        const GeocodeStore = useGeocodeStore();
        const OpaNum = GeocodeStore.aisData.features[0].properties.opa_account_num;
        const whereClause = `parcel_number='${OpaNum}'`;
        const response = await fetch(`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/OPA_PROPERTIES_PUBLIC/FeatureServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&f=json`);
        if (response.ok) {
          const data = await response.json();
          // Transform ArcGIS response format to match Carto format for compatibility with getters
          this.opaData = {
            rows: data.features ? data.features.map(f => f.attributes) : []
          };
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('opaData - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('opaData - await never resolved, failed to fetch address data')
      }
    },
    async _fillOpaDataCarto() {
      try {
        const GeocodeStore = useGeocodeStore();
        const OpaNum = GeocodeStore.aisData.features[0].properties.opa_account_num;
        const response = await fetch(`https://phl.carto.com/api/v2/sql?q=select+*+from+opa_properties_public+where+parcel_number+%3D+%27${OpaNum}%27`);
        if (response.ok) {
          this.opaData = await response.json()
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('opaData - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('opaData - await never resolved, failed to fetch address data')
      }
    },
    async fillAssessmentHistory() {
      try {
        const GeocodeStore = useGeocodeStore();
        const OpaNum = GeocodeStore.aisData.features[0].properties.opa_account_num;
        const response = await fetch(`https://phl.carto.com/api/v2/sql?q=select+*+from+assessments+where+parcel_number+%3D+%27${OpaNum}%27`);
        if (response.ok) {
          this.assessmentHistory = await response.json();
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('assessmentHistory - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('assessmentHistory - await never resolved, failed to fetch address data')
      }
    }
  },
  // keeping formatting getters here in the store only works if the data is not looped
  // through for a horizontal table
  getters: {
    getMarketValue: (state) => {
      if (state.opaData.rows && state.opaData.rows[0]) {
        return currency(state.opaData.rows[0].market_value || null);
      }
    },
    getSaleDate: (state) =>  {
      if (state.opaData.rows && state.opaData.rows[0]) {
        return date(state.opaData.rows[0].sale_date);
      }
    },
    getSalePrice: (state) => {
      if (state.opaData.rows && state.opaData.rows[0]) {
        return currency(state.opaData.rows[0].sale_price);
      }
    },
    getHomesteadExemption: (state) => {
      if (state.opaData.rows && state.opaData.rows[0]) {
        return state.opaData.rows[0].homestead_exemption > 0 ? state.opaData.rows[0].homestead_exemption : 'No';
      }
    },
    getDescription: (state) => {
      if (state.opaData.rows && state.opaData.rows[0]) {
        return titleCase(state.opaData.rows[0].building_code_description_new);
      }
    },
    getCondition: (state) => {
      if (state.opaData.rows && state.opaData.rows[0]) {
        const exterior = state.opaData.rows[0].exterior_condition;
        const condition =  exterior  == 0 ? 'Not Applicable' :
          exterior == 2 ? 'Newer Construction / Rehabbed' :
            exterior == 3 ? 'Above Average' :
              exterior == 4 ? 'Average' :
                exterior == 5 ? 'Below Average' :
                  exterior == 6 ? 'Vacant' :
                    exterior == 7 ? 'Sealed / Structurally Compromised, Open to the Weather' :
                      'Not available';
        return condition;
      }
    },
    getBeginningPoint: (state) => {
      if (state.opaData.rows && state.opaData.rows[0]) {
        return titleCase(state.opaData.rows[0].beginning_point);
      }
    },
    getLandArea: (state) => {
      if (state.opaData.rows && state.opaData.rows[0]) {
        return prettyNumber(state.opaData.rows[0].total_area) + ' sq ft';
      }
    },
    getImprovementArea: (state) => {
      if (state.opaData.rows && state.opaData.rows[0]) {
        return prettyNumber(state.opaData.rows[0].total_livable_area) + ' sq ft';
      }
    },
  },
})