import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMapStore } from '@/stores/MapStore.js'

import axios from 'axios';
import { format, subHours, subDays, subWeeks, subMonths, subYears } from 'date-fns';
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

  

export const useNearbyActivityStore = defineStore('NearbyActivityStore', {
  state: () => {
    return {
      dataError: false,
      loadingData: true,
      nearby311: {},
      nearbyCrimeIncidents: null,
      nearbyZoningAppeals: null,
      nearbyVacantIndicatorPoints: { rows: null },
      nearbyConstructionPermits: null,
      nearbyDemolitionPermits: null,
      nearbyUnsafeBuildings: null,
      dataFields: {
        nearby311: {
          title: '311 Requests',
          id_field: 'service_request_id',
          info_field: 'service_name',
        },
        nearbyCrimeIncidents: {
          title: 'Crime Incidents',
          id_field: 'objectid',
          info_field: 'text_general_code',
        },
        nearbyZoningAppeals: {
          title: 'Zoning Appeals',
          id_field: 'objectid',
          info_field: 'address',
        },
        nearbyVacantIndicatorPoints: {
          title: 'Vacant Properties',
          id_field: 'id',
          info_field: 'ADDRESS',
        },
        nearbyConstructionPermits: {
          title: 'Construction Permits',
          id_field: 'objectid',
          info_field: 'address',
        },
        nearbyDemolitionPermits: {
          title: 'Demolition Permits',
          id_field: 'objectid',
          info_field: 'address',
        },
        nearbyUnsafeBuildings: {
          title: 'Imminently Dangerous',
          id_field: 'casenumber',
          info_field: 'address',
        },
      },
    };
  },

  actions: {
    setDataError(error) {
      this.dataError = error;
    },
    setLoadingData(loading) {
      this.loadingData = loading;
    },
    async clearAllNearbyActivityData() {
      this.dataError = false;
      this.loadingData = true;
      this.nearby311 = {};
      this.nearbyCrimeIncidents = null;
      this.nearbyZoningAppeals = null;
      this.nearbyVacantIndicatorPoints = { rows: null };
      this.nearbyConstructionPermits = null;
      this.nearbyDemolitionPermits = null;
      this.nearbyUnsafeBuildings = null;
    },
    async fetchData(dataType) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log("fetchData is runnning, dataType:", dataType);
      if (dataType === '311') {
        await this.fillNearby311();
      } else if (dataType === 'crimeIncidents') {
        await this.fillNearbyCrimeIncidents();
      } else if (dataType === 'zoningAppeals') {
        await this.fillNearbyZoningAppeals();
      } else if (dataType === 'vacantIndicatorPoints') {
        await this.fillNearbyVacantIndicatorPoints();
      } else if (dataType === 'constructionPermits') {
        await this.fillNearbyConstructionPermits();
      } else if (dataType === 'demolitionPermits') {
        await this.fillNearbyDemolitionPermits();
      } else if (dataType === 'unsafeBuildings') {
        await this.fillNearbyUnsafeBuildings();
      }
    },
    async fillNearby311() {
      try {
        const GeocodeStore = useGeocodeStore();
        this.setLoadingData(true);
        const feature = GeocodeStore.aisData.features[0];
        let dataSource = {
          url: 'https://phl.carto.com/api/v2/sql?',
          options: {
            table: 'public_cases_fc',
            dateMinNum: 365,
            dateMinType: 'day',
            dateField: 'requested_datetime',
          },
        };
        let params = fetchNearby(feature, dataSource);
        const response = await axios.get(dataSource.url, { params })
        if (response.status === 200) {
          const data = response.data;
          data.rows.forEach(row => {
            row.distance_ft = (row.distance * 3.28084).toFixed(0) + ' ft';
            if (row.media_url) {
              row.link = `<a target='_blank' href=${row.media_url}>${row.service_name}</a>`;
            } else {
              row.link = row.service_name;
            }
          });
          this.nearby311 = data;
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
    async fillNearbyCrimeIncidents() {
      try {
        const GeocodeStore = useGeocodeStore();
        this.setLoadingData(true);
        const feature = GeocodeStore.aisData.features[0];
        let dataSource = {
          url: 'https://phl.carto.com/api/v2/sql?',
          options: {
            table: 'incidents_part1_part2',
            dateMinNum: 90,
            dateMinType: 'day',
            dateField: 'dispatch_date',
          },
        };
        let params = fetchNearby(feature, dataSource);
        const response = await axios.get(dataSource.url, { params })
        if (response.status === 200) {
          const data = response.data;
          data.rows.forEach(row => {
            row.distance_ft = (row.distance * 3.28084).toFixed(0) + ' ft';
          });
          this.nearbyCrimeIncidents = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyCrimeIncidents - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyCrimeIncidents - await never resolved, failed to fetch address data');
      }
    },
    async fillNearbyZoningAppeals() {
      try {
        const GeocodeStore = useGeocodeStore();
        this.setLoadingData(true);
        const feature = GeocodeStore.aisData.features[0];
        let dataSource = {
          url: 'https://phl.carto.com/api/v2/sql?',
          options: {
            table: 'appeals',
            dateMinNum: 1,
            dateMinType: 'year',
            dateField: 'scheduleddate',
            where: "appealtype like '%ZBA%' OR appealtype = 'Zoning Board of Adjustment'",
          },
        };
        let params = fetchNearby(feature, dataSource);
        const response = await axios.get(dataSource.url, { params })
        if (response.status === 200) {
          const data = response.data;
          data.rows.forEach(row => {
            row.distance_ft = (row.distance * 3.28084).toFixed(0) + ' ft';
            row.link = `<a target="blank" href="https://li.phila.gov/zba-appeals-calendar/appeal?from=2-6-2000&to=4-6-2050&region=all&Id=${row.appealnumber}">${row.appealnumber}</a>`;
          });
          this.nearbyZoningAppeals = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyZoningAppeals - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyZoningAppeals - await never resolved, failed to fetch address data');
      }
    },

    async fillNearbyVacantIndicatorPoints() {
      try {
        this.setLoadingData(true);
        const GeocodeStore = useGeocodeStore();
        const coordinates = GeocodeStore.aisData.features[0].geometry.coordinates;
        const MapStore = useMapStore();
        await MapStore.fillBufferForAddress(coordinates[0], coordinates[1]);
        const buffer = MapStore.bufferForAddress;
        if (import.meta.env.VITE_DEBUG == 'true') console.log('fillNearbyVacantIndicatorPoints, buffer:', buffer);

        const url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Vacant_Indicators_Points/FeatureServer/0/query?';

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
          const data = await response.data;

          let features = (data || {}).features;
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

          this.nearbyVacantIndicatorPoints.rows = features;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyVacantIndicatorPoints - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyVacantIndicatorPoints - await never resolved, failed to fetch address data');
      }
    },

    async fillNearbyConstructionPermits() {
      try {
        const GeocodeStore = useGeocodeStore();
        this.setLoadingData(true);
        const feature = GeocodeStore.aisData.features[0];
        let dataSource = {
          url: 'https://phl.carto.com/api/v2/sql?',
          options: {
            table: 'permits',
            where: "typeofwork like '%NEW CONSTRUCTION%'",
            dateMinNum: 1,
            dateMinType: 'year',
            dateField: 'permitissuedate',
          },
        };
        let params = fetchNearby(feature, dataSource);
        const response = await axios.get(dataSource.url, { params })
        if (response.status === 200) {
          const data = response.data;
          data.rows.forEach(row => {
            row.distance_ft = (row.distance * 3.28084).toFixed(0) + ' ft';
          });
          this.nearbyConstructionPermits = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyConstructionPermits - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyConstructionPermits - await never resolved, failed to fetch address data');
      }
    },

    async fillNearbyDemolitionPermits() {
      try {
        const GeocodeStore = useGeocodeStore();
        this.setLoadingData(true);
        const feature = GeocodeStore.aisData.features[0];
        let dataSource = {
          url: 'https://phl.carto.com/api/v2/sql?',
          options: {
            table: 'permits',
            where: "permitdescription like '%DEMOLITION PERMIT%'",
            dateMinNum: 1,
            dateMinType: 'year',
            dateField: 'permitissuedate',
          },
        };
        let params = fetchNearby(feature, dataSource);
        const response = await axios.get(dataSource.url, { params })
        if (response.status === 200) {
          const data = response.data;
          data.rows.forEach(row => {
            row.distance_ft = (row.distance * 3.28084).toFixed(0) + ' ft';
          });
          this.nearbyDemolitionPermits = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyDemolitionPermits - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyDemolitionPermits - await never resolved, failed to fetch address data');
      }
    },

    async fillNearbyUnsafeBuildings() {
      try {
        const GeocodeStore = useGeocodeStore();
        this.setLoadingData(true);
        const feature = GeocodeStore.aisData.features[0];
        let dataSource = {
          url: 'https://phl.carto.com/api/v2/sql?',
          options: {
            table: 'violations',
            where: "((caseprioritydesc like '%IMMINENTLY DANGEROUS%' and casestatus not in ('CLOSED', 'CANCELLED')) or (caseprioritydesc like 'UNSAFE' and casestatus not in ('CLOSED', 'CANCELLED')))",
            // dateMinNum: 1,
            // dateMinType: 'year',
            dateField: 'casecreateddate',
            groupby: 'casenumber, casecreateddate, caseprioritydesc, casestatus, address',
          },
        };
        let params = fetchNearby(feature, dataSource);
        const response = await axios.get(dataSource.url, { params })
        if (response.status === 200) {
          const data = response.data;
          data.rows.forEach(row => {
            row.distance_ft = (row.distance * 3.28084).toFixed(0) + ' ft';
            row.link = `<a target='_blank' href='https://li.phila.gov/property-history/search/violation-detail?address=${row.address}&Id=${row.casenumber}'>${row.casestatus}</a>`;
          });
          this.nearbyUnsafeBuildings = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyUnsafeBuildings - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyUnsafeBuildings - await never resolved, failed to fetch address data');
      }
    },
  },

});

