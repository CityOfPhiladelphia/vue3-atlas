import { defineStore } from 'pinia';

import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMapStore } from '@/stores/MapStore.js'

import axios from 'axios';
import { point, polygon, lineString } from '@turf/helpers';
import explode from '@turf/explode';
import nearest from '@turf/nearest-point';
import distance from '@turf/distance';
import qs from 'qs';

import { format } from 'date-fns';

if (import.meta.env.VITE_DEBUG == 'true') console.log('import.meta.env.VITE_AGO_USERNAME:', import.meta.env.VITE_AGO_USERNAME, 'import.meta.env.VITE_AGO_PASSWORD:', import.meta.env.VITE_AGO_PASSWORD);

export const useCity311Store = defineStore('City311Store', {
  state: () => {
    return {
      agoToken: null,
      city311: {},
      loadingCity311: true,
      dataFields: {
        city311: {
          title: '311 Requests',
          id_field: 'id',
          info_field: 'SERVICE_NAME',
        },
      },
    };
  },
  actions: {
    async getAgoToken() {
      let data = qs.stringify({
        'f': 'json',
        'username': import.meta.env.VITE_AGO_USERNAME,
        'password': import.meta.env.VITE_AGO_PASSWORD,
        'referer': 'https://www.mydomain.com',
        'expiration': 1,
      });
  
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://www.arcgis.com/sharing/rest/generateToken',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded', 
          // 'Authorization': 'Basic Og=='
        },
        data : data
      };
  
      await axios.request(config)
      .then((response) => {
        // if (import.meta.env.VITE_DEBUG) console.log(JSON.stringify(response.data));
        this.agoToken= response.data.token;
      })
      .catch((error) => {
        if (import.meta.env.VITE_DEBUG == 'true') console.log(error);
      });
    },
    async fillCity311() {
      try {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('fillCity311 is running');
        this.loadingCity311 = true;
        const GeocodeStore = useGeocodeStore();
        const coordinates = GeocodeStore.aisData.features[0].geometry.coordinates;
        const MapStore = useMapStore();
        await MapStore.fillBufferForAddress(coordinates[0], coordinates[1]);
        const buffer = MapStore.bufferForAddress;
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('nearby311 still going 1');
        
        const url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/SALESFORCE_CASES_1YEAR/FeatureServer/0/query?';
        const xyCoords = buffer[0];
        let xyCoordsReduced = [[ parseFloat(xyCoords[0][0].toFixed(6)), parseFloat(xyCoords[0][1].toFixed(6)) ]];
        var i;


        for (i = 0; i < xyCoords.length; i++) {
          if (i%3 == 0) {
            let newXyCoordReduced = [ parseFloat(xyCoords[i][0].toFixed(6)), parseFloat(xyCoords[i][1].toFixed(6)) ];
            xyCoordsReduced.push(newXyCoordReduced);
          }
        }
        xyCoordsReduced.push([ parseFloat(xyCoords[0][0].toFixed(6)), parseFloat(xyCoords[0][1].toFixed(6)) ]);
        
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        const yyyy = today.getFullYear() - 1;
        const lastYear = yyyy + '-' + mm + '-' + dd;
        const where = "REQUESTED_DATETIME > DATE '" + lastYear + "'";

        const params = {
          'returnGeometry': true,
          'where': where,
          'outSR': 4326,
          'outFields': '*',
          'inSr': 4326,
          'geometryType': 'esriGeometryPolygon',
          'spatialRel': 'esriSpatialRelContains',
          'f': 'geojson',
          'geometry': JSON.stringify({ "rings": [xyCoordsReduced], "spatialReference": { "wkid": 4326 }}),
          'token': this.agoToken,
        };

        const response = await axios.get(url, { params });
        if (response.status === 200) {
          const data = await response.data;

          let features = (data || {}).features;
          // const GeocodeStore = useGeocodeStore();
          const feature = GeocodeStore.aisData.features[0];
          const from = point(feature.geometry.coordinates);

          features = features.map(feature => {
            const featureCoords = feature.geometry.coordinates;
            let dist;
            if (Array.isArray(featureCoords[0])) {
              let instance;
              if (feature.geometry.type === 'LineString') {
                instance = lineString([ featureCoords[0], featureCoords[1] ], { name: 'line 1' });
              } else {
                instance = polygon([ featureCoords[0] ]);
              }
              const vertices = explode(instance);
              const closestVertex = nearest(from, vertices);
              dist = distance(from, closestVertex, { units: 'miles' });
            } else {
              const to = point(featureCoords);
              dist = distance(from, to, { units: 'miles' });
            }
            const distFeet = parseInt(dist * 5280);
            feature.properties.distance_ft = distFeet + ' ft';
            return feature;
          });

          features.forEach(feature => {
            // if (import.meta.env.VITE_DEBUG) console.log('feature:', feature);
            feature.properties.date = format(feature.properties.REQUESTED_DATETIME, 'MM/dd/yyyy');
            if (feature.properties.MEDIA_URL) {
              feature.properties.link = `<a target='_blank' href=${feature.properties.MEDIA_URL}>${feature.properties.SERVICE_NAME}</a>`;
            } else {
              feature.properties.link = feature.properties.SERVICE_NAME;
            }
          });

          this.city311.rows = features;
          this.loadingCity311 = false;
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('311 - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('311 - await never resolved, failed to fetch address data');
        this.loadingCity311 = false;
      }
    },
  },
});
  