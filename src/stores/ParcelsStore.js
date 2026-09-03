import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMainStore } from '@/stores/MainStore.js'
import axios from 'axios';
import useParcels from '@/composables/useParcels';
import $config from '@/config';
import { API_SOURCES } from '@/config/apiSources.js';
const { processParcels } = useParcels();

// fetches parcels from carto as GeoJSON, normalized to match the ArcGIS response shape:
// carto features carry no top-level id (consumers match feature.id against selectedParcelId),
// and carto wraps single polygons in MultiPolygon
async function fetchCartoParcels(sql) {
  const response = await axios('https://phl.carto.com/api/v2/sql', { params: { q: sql, format: 'GeoJSON' } });
  if (response.status !== 200 || !response.data.features) {
    return null;
  }
  for (const feature of response.data.features) {
    feature.id = feature.properties.objectid;
    if (feature.geometry && feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates.length === 1) {
      feature.geometry = { type: 'Polygon', coordinates: feature.geometry.coordinates[0] };
    }
  }
  return response.data;
}

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
        if (API_SOURCES.pwdParcels === 'arcgis') {
          const response = await fetch(`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/PWD_PARCELS/FeatureServer/0/query?where=parcelid=%27${pwdParcelNumber}%27&outSR=4326&f=geojson&outFields=*&returnGeometry=true`);
          if (response.ok) {
            this.pwd = await response.json()
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillPwdParcelData - await resolved but HTTP status was not successful');
          }
        } else {
          const data = await fetchCartoParcels(`select * from pwd_parcels where parcelid = '${pwdParcelNumber}'`);
          if (data) {
            this.pwd = data;
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillPwdParcelData - carto query did not return features');
          }
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
      let whereClause;

      if (dorParcelId.includes('|')) {
        const idSplit = dorParcelId.split('|');
        let queryString = "mapreg = '";
        let i;
        for (i=0; i<idSplit.length; i++) {
          queryString = queryString + idSplit[i] + "'";
          if (i < idSplit.length - 1) {
            queryString = queryString + " or mapreg = '";
          }
        }

        whereClause = queryString;

      } else if (Array.isArray(dorParcelId)) {
        whereClause = 'mapreg IN (' + dorParcelId + ')';
      } else {
        whereClause = "mapreg='" + dorParcelId + "'";
      }

      let params = {
        'outSR': 4326,
        'f': 'geojson',
        'outFields': '*',
        'returnGeometry': true,
      };

      try {
        let originalJson;
        if (API_SOURCES.dorParcels === 'arcgis') {
          const response = await axios(url + '?where=' + whereClause, { params });
          if (response.status !== 200) {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillDorParcelData - await resolved but HTTP status was not successful');
            return;
          }
          if (import.meta.env.VITE_DEBUG == 'true') console.log('response', response);
          originalJson = response.data;
        } else {
          originalJson = await fetchCartoParcels(`select * from dor_parcel where ${whereClause}`);
          if (!originalJson) {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillDorParcelData - carto query did not return features');
            return;
          }
        }
        const processedData = await processParcels(originalJson);
        const MainStore = useMainStore();
        MainStore.selectedParcelId = processedData.features[0].properties.objectid;
        this.dor = processedData;
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
        let responseData;
        if (API_SOURCES[parcelLayer === 'pwd' ? 'pwdParcels' : 'dorParcels'] === 'arcgis') {
          const response = await axios(`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/${ESRILayer}/FeatureServer/0/query`, { params });
          if (response.status !== 200) {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('checkParcelDataByLngLat - await resolved but HTTP status was not successful')
          }
          responseData = response.data;
        } else {
          const cartoTable = parcelLayer === 'pwd' ? 'pwd_parcels' : 'dor_parcel';
          responseData = await fetchCartoParcels(`select * from ${cartoTable} where ST_Contains(the_geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))`) || {};
        }
        // a failed query can return 200 with an { error } body and no features
        if (responseData.features && responseData.features.length > 0) {
          let data = responseData;
          let processedData;

          if (parcelLayer === 'dor') {
            processedData = await processParcels(data);
            MainStore.selectedParcelId = processedData.features[0].properties.objectid;
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
})
