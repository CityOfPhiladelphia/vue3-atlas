import { defineStore, acceptHMRUpdate } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMainStore } from '@/stores/MainStore.js'
import axios from 'axios';
import useParcels from '@/composables/useParcels';
import $config from '@/config';
const { processParcels } = useParcels();

export const useParcelsStore = defineStore('ParcelsStore', {
  state: () => {
    return {
      pwdChecked: {},
      pwd: {},
      dorChecked: {},
      dor: {},
    };
  },
  actions: {
    async fillPwdParcelData() {
      const GeocodeStore = useGeocodeStore();
      const AddressLoaded = GeocodeStore.aisData.features
      if (!AddressLoaded) { return }
      const aisData = AddressLoaded[0];
      const pwdParcelNumber = aisData.properties.pwd_parcel_id;
      if (!pwdParcelNumber) {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('no pwd parcel in AIS')
        await this.checkParcelDataByLngLat(aisData.geometry.coordinates[0], aisData.geometry.coordinates[1], 'pwd');
        this.pwd = this.pwdChecked;
        return;
      }
      try {
        const response = await fetch(`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/PWD_PARCELS/FeatureServer/0/query?where=PARCELID=%27${pwdParcelNumber}%27&outSR=4326&f=geojson&outFields=*&returnGeometry=true`);
        if (response.ok) {
          this.pwd = await response.json()
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillPwdParcelData - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillPwdParcelData - await never resolved, failed to fetch parcel data');
      }
    },

    async fillDorParcelData() {
      const GeocodeStore = useGeocodeStore();
      const AddressLoaded = GeocodeStore.aisData.features
      if (!AddressLoaded) { return }
      const aisData = AddressLoaded[0];
      const dorParcelId = aisData.properties.dor_parcel_id;
      if (!dorParcelId) {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('no dor parcel in AIS')
        await this.checkParcelDataByLngLat(aisData.geometry.coordinates[0], aisData.geometry.coordinates[1], 'dor');
        this.dor = this.dorChecked;
        return;
      }

      const url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/DOR_Parcel/FeatureServer/0/query';
      let parcelQuery;

      if (dorParcelId.includes('|')) {
        const idSplit = dorParcelId.split('|');
        let queryString = "MAPREG = '";
        let i;
        for (i=0; i<idSplit.length; i++) {
          queryString = queryString + idSplit[i] + "'";
          if (i < idSplit.length - 1) {
            queryString = queryString + " or MAPREG = '";
          }
        }

        parcelQuery = url + '?where=' + queryString;

      } else if (Array.isArray(dorParcelId)) {
        parcelQuery = url + '?where=MAPREG IN (' + dorParcelId + ')';
      } else {
        parcelQuery = url + "?where=MAPREG='" + dorParcelId + "'";
      }

      let params = {
        'outSR': 4326,
        'f': 'geojson',
        'outFields': '*',
        'returnGeometry': true,
      };

      try {
        const response = await axios(parcelQuery, { params });
        if (response.status === 200) {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('response', response);
          const originalJson = await response.data;
          const processedData = await processParcels(originalJson);
          const MainStore = useMainStore();
          MainStore.selectedParcelId = processedData.features[0].properties.OBJECTID;
          this.dor = processedData;
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillDorParcelData - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillDorParcelData - await never resolved, failed to fetch parcel data');
      }
    },

    async checkParcelDataByLngLat(lng, lat, parcelLayer) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('checkParcelDataByLngLat, lng:', lng, 'lat:', lat, 'parcelLayer:', parcelLayer);
      let ESRILayer = parcelLayer === 'pwd' ? 'PWD_PARCELS' : 'DOR_Parcel';
      let params = {
        'where': '1=1',
        'outSR': 4326,
        'f': 'geojson',
        'outFields': '*',
        'returnGeometry': true,
        'geometry': `{ "x": ${lng}, "y": ${lat}, "spatialReference":{ "wkid":4326 }}`,
        'geometryType': 'esriGeometryPoint',
        'spatialRel': 'esriSpatialRelWithin',
      };
      const MainStore = useMainStore();
      try {
        const response = await axios(`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/${ESRILayer}/FeatureServer/0/query`, { params });
        if (response.status !== 200) {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('checkParcelDataByLngLat - await resolved but HTTP status was not successful')
        }
        if (response.data.features.length > 0) {
          let data = await response.data;
          let processedData;

          if (parcelLayer === 'dor') {
            processedData = await processParcels(data);
            MainStore.selectedParcelId = processedData.features[0].properties.OBJECTID;
          } else {
            processedData = data;
          }
          this[`${parcelLayer}Checked`] = processedData;
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('in else, parcelLayer:', parcelLayer, '$config.parcelLayerForTopic[MainStore.currentTopic]:', $config.parcelLayerForTopic[MainStore.currentTopic]);
          this[`${parcelLayer}Checked`] = {};
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error(`checkParcelDataByLngLat await never resolved, failed to fetch ${parcelLayer} parcel data by lng/lat`)
        this[`${parcelLayer}Checked`] = {};
      }
    },
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useParcelsStore, import.meta.hot))
};