import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMapStore } from '@/stores/MapStore.js'

import axios from 'axios';
import { point, polygon, lineString } from '@turf/helpers';
import distance from '@turf/distance';
import explode from '@turf/explode';
import nearest from '@turf/nearest-point';

const evaluateParams = (feature, dataSource) => {
  const params = {};
  if (!dataSource.options.params) {
    return params; 
  }
  // if (import.meta.env.VITE_DEBUG == 'true') console.log("dataSource: ", dataSource);
  const paramEntries = Object.entries(dataSource.options.params);

  for (let [ key, valOrGetter ] of paramEntries) {
    let val;

    if (typeof valOrGetter === 'function') {
      val = valOrGetter(feature);
    } else {
      val = valOrGetter;
    }
    params[key] = val;
  }
  // if (import.meta.env.VITE_DEBUG == 'true') console.log("params: ", params)
  return params;
}

// this was the fetch function from @phila/vue-datafetch http-client.js
const fetchNearby = (feature, dataSource) => {
  const params = evaluateParams(feature, dataSource);
  const options = dataSource.options;
  // const srid = options.srid || 4326;
  const table = options.table;
  // TODO generalize these options into something like a `sql` param that
  // returns a sql statement
  const dateMinNum = options.dateMinNum || null;
  const dateMinType = options.dateMinType || null;
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('dateMinType:', dateMinType);
  const dateField = options.dateField || null;
  const distances = options.distances || 250;
  if (import.meta.env.VITE_DEBUG == 'true') console.log('fetchNearby options:', options, 'distances:', distances);
  const extraWhere = options.where || null;

  const groupby = options.groupby || null;

  const distQuery = "(ST_Distance(the_geom::geography, ST_SetSRID(ST_Point("
                  + feature.geometry.coordinates[0]
                  + "," + feature.geometry.coordinates[1]
                  + "),4326)::geography))";

  const latQuery = "ST_Y(the_geom)";
  const lngQuery = "ST_X(the_geom)";

  let select;
  
  if (!groupby) {
    select = '*';
  } else {
    select = groupby + ', the_geom';
  }
  // if (calculateDistance) {
  select = select + ", " + distQuery + 'as distance,' + latQuery + 'as lat, ' + lngQuery + 'as lng';
  // }

  params['q'] = "select " + select + " from " + table + " where " + distQuery + " < " + distances;

  let subFn;
  if (dateMinNum) {
    // let subFn, addFn;
    switch (dateMinType) {
    case 'hour':
      subFn = subHours;
      break;
    case 'day':
      subFn = subDays;
      break;
    case 'week':
      subFn = subWeeks;
      break;
    case 'month':
      subFn = subMonths;
      break;
    case 'year':
      subFn = subYears;
      break;
    }

    // let test = format(subFn(new Date(), dateMinNum), 'YYYY-MM-DD');
    params['q'] = params['q'] + " and " + dateField + " > '" + format(subFn(new Date(), dateMinNum), 'yyyy-MM-dd') + "'";
  }

  if (extraWhere) {
    params['q'] = params['q'] + " and " + extraWhere;
  }

  if (groupby) {
    params['q'] = params['q'] + " group by " + groupby + ", the_geom";
  }
  return params
}

export const useCityServicesStore = defineStore('CityServicesStore', {
  state: () => {
    return {
      dataError: false,
      loadingData: true,
      esCatchments: null,
      msCatchments: null,
      hsCatchments: null,
      allSchools: null,
      allPoliceStations: null,
      nearbySchools: null,
      nearbyFireStations: null,
      elementarySchool: null,
      middleSchool: null,
      highSchool: null,
      dataFields: {
        nearbySchools: {
          title: 'Nearby Schools',
          id_field: 'id',
          info_field: 'SCHOOL_NAME_LABEL',
        },
        nearbyFireStations: {
          title: 'Nearby Fire Stations',
          id_field: 'FIRESTA_',
          info_field: 'LOCATION',
        },
      }
    }
  },
  actions: {
    setDataError(error) {
      this.dataError = error;
    },
    setLoadingData(loading) {
      this.loadingData = loading;
    },
    async clearAllCityServicesData() {
      this.dataError = false;
      this.loadingData = true;
    },
    async fetchData(dataType) {
      if (import.meta.env.VITE_DEBUG) console.log('fetchData is running, dataType:', dataType);
      this.setLoadingData(false);
      const GeocodeStore = useGeocodeStore();
      const coordinates = GeocodeStore.aisData.features[0].geometry.coordinates;
      const MapStore = useMapStore();
      await MapStore.fillBufferForAddress(coordinates[0], coordinates[1], 5820);
      if (dataType === 'public-schools') {
        await this.fillNearbySchools();
      } else if (dataType === 'public-safety') {
        await this.fillNearbyFireStations();
      }
    },
    async fillAllCatchments() {
      try {
        const params = {
          where: '1=1',
          outFields: '*',
          f: 'geojson',
        }
        const esResponse = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/SchoolDist_Catchments_ES/FeatureServer/0/query?', { params });
        if (esResponse.status === 200) {
          const data = esResponse.data;
          this.esCatchments = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyCatchments - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }

        const msResponse = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/SchoolDist_Catchments_ES/FeatureServer/0/query?', { params });
        if (msResponse.status === 200) {
          const data = msResponse.data;
          this.msCatchments = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyCatchments - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }

        const hsResponse = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/SchoolDist_Catchments_ES/FeatureServer/0/query?', { params });
        if (hsResponse.status === 200) {
          const data = hsResponse.data;
          this.hsCatchments = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyCatchments - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }

      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyCatchments - await never resolved, failed to fetch address data');
        this.setLoadingData(false);
        this.setDataError(true);
      }
    },
    async fillAllPoliceStations() {
      const params = {
        where: '1=1',
        outFields: '*',
        f: 'geojson',
      }
      try {
        const response = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Police_Stations/FeatureServer/0/query?', { params });
        if (response.status === 200) {
          const data = response.data;
          this.allPoliceStations = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearby311 - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('allPoliceStations - await never resolved, failed to fetch address data');
        this.setLoadingData(false);
        this.setDataError(true);
      }
    },
    async fillAllSchools() {
      try {
        const params = {
          where: '1=1',
          outFields: '*',
          f: 'geojson',
        }
        const response = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Schools/FeatureServer/0/query?', { params });
        if (response.status === 200) {
          const data = response.data;
          this.allSchools = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearby311 - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearby311 - await never resolved, failed to fetch address data');
        this.setLoadingData(false);
        this.setDataError(true);
      }
    },
    async fillNearbySchools() {
      try {
        this.setLoadingData(true);
        const GeocodeStore = useGeocodeStore();
        const MapStore = useMapStore();
        const buffer = MapStore.bufferForAddress;
        const url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Schools/FeatureServer/0/query?';
        const params = {
          'returnGeometry': true,
          'where': '1=1',
          'outSR': 4326,
          'outFields': '*',
          'inSr': 4326,
          'geometryType': 'esriGeometryPolygon',
          'spatialRel': 'esriSpatialRelContains',
          'f': 'geojson',
          'geometry': JSON.stringify({ "rings": buffer, "spatialReference": { "wkid": 4326 }}),
        };

        const response = await axios.get(url, { params });
        if (response.status === 200) {
          // if (import.meta.env.VITE_DEBUG) console.log('this.elementarySchool:', this.elementarySchool.id, 'this.middleSchool:', this.middleSchool.id, 'this.highSchool:', this.highSchool.id);
          const designatedSchools = [this.elementarySchool.id, this.middleSchool.id, this.highSchool.id];
          const data = await response.data;

          let features = (data || {}).features;
          const feature = GeocodeStore.aisData.features[0];
          const from = point(feature.geometry.coordinates);

          features = features.filter(feature => !designatedSchools.includes(feature.id)).map(feature => {
            // if (import.meta.env.VITE_DEBUG) console.log('feature:', feature);
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
            // const distFeet = parseInt(dist * 5280);
            feature.properties.distance_mi = dist.toFixed(2) + ' mi';
            feature.properties.schoolInfo = '<b>' + feature.properties.SCHOOL_NAME_LABEL + '</b><br>' + feature.properties.STREET_ADDRESS + '<br>Philadelphia, PA ' + feature.properties.ZIP_CODE + '<br>' + feature.properties.PHONE_NUMBER;
            return feature;
          });

          this.nearbySchools = features;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbySchools - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbySchools - await never resolved, failed to fetch address data');
      }
    },
    async fillNearbyFireStations() {
      try {
        this.setLoadingData(true);
        const GeocodeStore = useGeocodeStore();
        const MapStore = useMapStore();
        const buffer = MapStore.bufferForAddress;
        const url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Fire_Dept_Facilities/FeatureServer/0/query?';
        const params = {
          'returnGeometry': true,
          'where': 'FIRESTA_ IS NOT NULL',
          'outSR': 4326,
          'outFields': '*',
          'inSr': 4326,
          'geometryType': 'esriGeometryPolygon',
          'spatialRel': 'esriSpatialRelContains',
          'f': 'geojson',
          'geometry': JSON.stringify({ "rings": buffer, "spatialReference": { "wkid": 4326 }}),
        };

        const response = await axios.get(url, { params });
        if (response.status === 200) {
          // if (import.meta.env.VITE_DEBUG) console.log('this.elementarySchool:', this.elementarySchool.id, 'this.middleSchool:', this.middleSchool.id, 'this.highSchool:', this.highSchool.id);
          // const designatedSchools = [this.elementarySchool.id, this.middleSchool.id, this.highSchool.id];
          const data = await response.data;

          let features = (data || {}).features;
          const feature = GeocodeStore.aisData.features[0];
          const from = point(feature.geometry.coordinates);

          features = features.map(feature => {
            // if (import.meta.env.VITE_DEBUG) console.log('feature:', feature);
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
            // const distFeet = parseInt(dist * 5280);
            feature.properties.distance_mi = dist.toFixed(2) + ' mi';
            feature.properties.stationInfo = '';
            feature.properties.ENG && feature.properties.ENG != 0 ? feature.properties.stationInfo += 'Engine ' + feature.properties.ENG : '';
            feature.properties.ENG && feature.properties.ENG != 0 && feature.properties.LAD && feature.properties.LAD != 0 ? feature.properties.stationInfo += ' / ' : '';
            feature.properties.LAD && feature.properties.LAD != 0 ? feature.properties.stationInfo += 'Ladder ' + feature.properties.LAD : '';
            feature.properties.LAD && feature.properties.LAD != 0 && feature.properties.MED && feature.properties.MED != 0 || feature.properties.ENG && feature.properties.ENG != 0 && feature.properties.MED && feature.properties.MED != 0 ? feature.properties.stationInfo += ' / ' : '';
            feature.properties.MED && feature.properties.MED != 0 ? feature.properties.stationInfo += 'Medic ' + feature.properties.MED : '';
            feature.properties.stationInfo += '<br>' + feature.properties.LOCATION;// + '<br>Philadelphia, PA ';// + feature.properties.ZIP_CODE;
            return feature;
          });

          this.nearbyFireStations = features;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyFireStations - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyFireStations - await never resolved, failed to fetch address data');
      }
    }
  },
});
