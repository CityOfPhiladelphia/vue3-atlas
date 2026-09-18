import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMapStore } from '@/stores/MapStore.js'

import axios from 'axios';
import { format, subHours, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { point, polygon, lineString } from '@turf/helpers';
import distance from '@turf/distance';
import explode from '@turf/explode';
import nearest from '@turf/nearest-point';
import { API_SOURCES } from '@/config/apiSources.js';
import { fetchTableWithFallback, fetchTableGeoJSON } from '@/util/databridge.js';

// databridge has no select *: shape must be transformed to 4326 explicitly, so columns are listed
const VACANT_POINTS_DATABRIDGE_COLS = 'objectid, land_rank, build_rank, vacant_rank, date_update, councildistrict, zoningbasedistrict, zipcode, vacant_flag, address, owner1, owner2, bldg_desc, opa_id, lniaddresskey';

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

// the same tables sit behind both transports, but with different geometry columns:
// carto v2 has the_geom (4326), databridge has shape (2272) needing an explicit transform
const NEARBY_GEOM = {
  carto: { expr: 'the_geom', column: 'the_geom' },
  databridge: { expr: 'ST_Transform(shape, 4326)', column: 'shape' },
};

// builds the WHERE shared by both query styles: the radius predicate against the given
// geometry expression, plus the dataSource's date cutoff and extra conditions
const buildNearbyWhere = (feature, dataSource, geomExpr) => {
  const options = dataSource.options;
  const dateMinNum = options.dateMinNum || null;
  const dateMinType = options.dateMinType || null;
  const dateField = options.dateField || null;
  const distances = options.distances || 250;
  const extraWhere = options.where || null;

  const distQuery = "(ST_Distance(" + geomExpr + "::geography, ST_SetSRID(ST_Point("
                  + feature.geometry.coordinates[0]
                  + "," + feature.geometry.coordinates[1]
                  + "),4326)::geography))";

  let where = distQuery + " < " + distances;

  if (dateMinNum) {
    let subFn;
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
    where = where + " and " + dateField + " > '" + format(subFn(new Date(), dateMinNum), 'yyyy-MM-dd') + "'";
  }

  if (extraWhere) {
    where = where + " and " + extraWhere;
  }

  return { distQuery, where };
}

// this was the fetch function from @phila/vue-datafetch http-client.js; it now builds
// only the carto fallback statement
const fetchNearby = (feature, dataSource, source = 'carto') => {
  const params = evaluateParams(feature, dataSource);
  const options = dataSource.options;
  const table = options.table;
  const groupby = options.groupby || null;
  const geom = NEARBY_GEOM[source];
  const { distQuery, where } = buildNearbyWhere(feature, dataSource, geom.expr);

  const latQuery = "ST_Y(" + geom.expr + ")";
  const lngQuery = "ST_X(" + geom.expr + ")";

  let select;

  if (!groupby) {
    select = '*';
  } else {
    select = groupby + ', ' + geom.column;
  }
  select = select + ", " + distQuery + 'as distance,' + latQuery + 'as lat, ' + lngQuery + 'as lng';

  params['q'] = "select " + select + " from " + table + " where " + where;

  if (groupby) {
    params['q'] = params['q'] + " group by " + groupby + ", " + geom.column;
  }
  return params
}

// the table-style query for fetchTableWithFallback: the same table and predicates,
// with the carto statement kept as the explicit fallback (its geometry column
// differs); distance/lat/lng for table rows are derived by addNearbyDerived
const nearbyTableQuery = (feature, dataSource) => {
  const { where } = buildNearbyWhere(feature, dataSource, NEARBY_GEOM.databridge.expr);
  return {
    table: dataSource.options.table,
    where,
    withGeometry: true,
    service: 'carto',
    cartoSql: fetchNearby(feature, dataSource).q,
  };
}

// fills in distance (meters, matching the sql ST_Distance::geography), lat, and lng
// for table-path rows, which carry geometry instead of computed columns; carto
// fallback rows already have all three from the sql
const addNearbyDerived = (rows, feature) => {
  const from = point(feature.geometry.coordinates);
  rows.forEach((row) => {
    if (row.distance === undefined && row.geometry) {
      row.lng = row.geometry.coordinates[0];
      row.lat = row.geometry.coordinates[1];
      row.distance = distance(from, point(row.geometry.coordinates), { units: 'kilometers' }) * 1000;
    }
  });
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
          info_field: 'address',
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
          options: {
            table: 'public_cases_fc',
            dateMinNum: 365,
            dateMinType: 'day',
            dateField: 'requested_datetime',
          },
        };
        const data = await fetchTableWithFallback('nearby311', nearbyTableQuery(feature, dataSource));
        if (data) {
          addNearbyDerived(data.rows, feature);
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
          options: {
            table: 'incidents_part1_part2',
            dateMinNum: 90,
            dateMinType: 'day',
            dateField: 'dispatch_date',
          },
        };
        const data = await fetchTableWithFallback('nearbyCrimeIncidents', nearbyTableQuery(feature, dataSource));
        if (data) {
          if (import.meta.env.VITE_DEBUG) console.log('nearbyCrimeIncidents data:', data);
          addNearbyDerived(data.rows, feature);
          data.rows.forEach(row => {
            row.distance_ft = (row.distance * 3.28084).toFixed(0) + ' ft';
          });
          this.nearbyCrimeIncidents = data;
          if (import.meta.env.VITE_DEBUG) console.log('this.nearbyCrimeIncidents:', this.nearbyCrimeIncidents);
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
          options: {
            table: 'appeals',
            dateMinNum: 1,
            dateMinType: 'year',
            dateField: 'scheduleddate',
            where: "(appealtype like '%ZBA%' OR appealtype = 'Zoning Board of Adjustment')",
          },
        };
        const data = await fetchTableWithFallback('nearbyZoningAppeals', nearbyTableQuery(feature, dataSource));
        if (data) {
          addNearbyDerived(data.rows, feature);
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

        let data;
        if (API_SOURCES.vacantIndicatorPoints === 'databridge') {
          // same 750ft-around-the-address semantics as the buffer-contains query above
          // (this store's fillBufferForAddress call uses the 750ft default); shape is
          // native EPSG:2272 whose units are feet, so ST_DWithin takes 750 directly
          data = await fetchTableGeoJSON({ table: 'vacant_indicators_points', fields: VACANT_POINTS_DATABRIDGE_COLS, where: `ST_DWithin(shape, ST_Transform(ST_SetSRID(ST_MakePoint(${coordinates[0]}, ${coordinates[1]}), 4326), 2272), 750)`, service: 'carto' });
          if (!data) console.warn('nearbyVacantIndicatorPoints - databridge request failed, falling back to direct arcgis');
        }
        if (!data) {
          const response = await axios.get(url, { params });
          if (response.status !== 200) {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyVacantIndicatorPoints - await resolved but HTTP status was not successful');
            return;
          }
          data = response.data;
        }

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
          options: {
            table: 'permits',
            // ilike: the table's typeofwork values are mixed-case (e.g. 'New Construction',
            // 'New construction, addition, GFA change') and case-sensitive like matches nothing
            where: "typeofwork ilike '%new construction%'",
            dateMinNum: 1,
            dateMinType: 'year',
            dateField: 'permitissuedate',
          },
        };
        const data = await fetchTableWithFallback('nearbyConstructionPermits', nearbyTableQuery(feature, dataSource));
        if (data) {
          addNearbyDerived(data.rows, feature);
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
          options: {
            table: 'permits',
            // ilike: the table's value is 'Demolition Permit' and case-sensitive like matches nothing
            where: "permitdescription ilike '%demolition permit%'",
            dateMinNum: 1,
            dateMinType: 'year',
            dateField: 'permitissuedate',
          },
        };
        const data = await fetchTableWithFallback('nearbyDemolitionPermits', nearbyTableQuery(feature, dataSource));
        if (data) {
          addNearbyDerived(data.rows, feature);
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
          options: {
            table: 'violations',
            where: "((caseprioritydesc like '%IMMINENTLY DANGEROUS%' and casestatus not in ('CLOSED', 'CANCELLED')) or (caseprioritydesc like 'UNSAFE' and casestatus not in ('CLOSED', 'CANCELLED')))",
            // dateMinNum: 1,
            // dateMinType: 'year',
            dateField: 'casecreateddate',
            groupby: 'casenumber, casecreateddate, caseprioritydesc, casestatus, address',
          },
        };
        const data = await fetchTableWithFallback('nearbyUnsafeBuildings', nearbyTableQuery(feature, dataSource));
        if (data) {
          addNearbyDerived(data.rows, feature);
          // replaces the sql GROUP BY (which included the geometry column): collapse
          // duplicate case rows - one per violation on the case; the grouped carto
          // fallback rows have no duplicates, so this is a no-op there
          const seen = new Set();
          data.rows = data.rows.filter(row => {
            const key = [row.casenumber, row.casecreateddate, row.caseprioritydesc, row.casestatus, row.address,
              JSON.stringify(row.geometry && row.geometry.coordinates)].join('|');
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });
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

