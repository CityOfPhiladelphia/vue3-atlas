import { defineStore } from 'pinia';
import { useParcelsStore } from './ParcelsStore';
import { useGeocodeStore } from './GeocodeStore';
import { API_SOURCES } from '@/config/apiSources.js';
import { fetchDatabridgeGeoJSON, fetchRowsWithFallback } from '@/util/databridge.js';
import { buildSearchWhere, buildOrderBy, buildCountSql, buildPageSql, REMOTE_THRESHOLD, REMOTE_SERVER_PAGE } from '@/util/remoteTable.js';

// databridge has no select *: shape must be transformed to 4326 explicitly, so columns are listed
// RECMAP aliased uppercase because Deeds.vue reads properties.RECMAP (the AGO field's real casing)
const REGMAPS_DATABRIDGE_COLS = 'recmap as "RECMAP", recsub, scale, objectid';

// vue-good-table column field -> SQL column for server-side sorting of deeded condos
const CONDOS_SORT_COLUMNS = {
  condo_parcel: 'condoparcel',
  condo_name: 'condo_name',
  unit_number: 'condounit',
};
const CONDOS_SEARCH_COLUMNS = [ 'recmap', 'condoparcel', 'condo_name', 'condounit' ];

// vue-good-table column field -> SQL column for server-side sorting of deeds documents
const DOCS_SORT_COLUMNS = {
  link: 'document_id',
  date: 'display_date',
  document_type: 'document_type',
  grantors: 'grantors',
  grantees: 'grantees',
  unit_num: 'unit_num',
};
const DOCS_SEARCH_COLUMNS = [ 'grantors', 'grantees', 'unit_num' ];
const DOCS_BASE_COLS = 'document_id, display_date, document_type, grantors, grantees, unit_num';

import bboxPolygon from '@turf/bbox-polygon';
import axios from 'axios';

import useTransforms from '@/composables/useTransforms';
const { date } = useTransforms();

const cleanDorAttribute = function(attr) {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('cleanDorAttribute is running with attr', attr);
  // trim leading and trailing whitespace
  var cleanAttr = attr ? String(attr) : '';
  cleanAttr = cleanAttr.replace(/\s+/g, '');

  // return null for zeros and empty strings
  // if (['', '0'].indexOf(cleanAttr) > -1) {
  //   return null;
  // }

  // return empty for zeros and null
  if ([ null, '0' ].indexOf(cleanAttr) > -1) {
    return '';
  }

  // if (import.meta.env.VITE_DEBUG == 'true') console.log('cleanDorAttribute cleanAttr result:', cleanAttr);
  return cleanAttr;
}

// TODO put this in base config transforms
const concatDorAddress = function(parcel, includeUnit) {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('concatDorAddress is running, parcel:', parcel);
  includeUnit = !!includeUnit;
  var STREET_FIELDS = [ 'STDIR', 'STNAM', 'STDES', 'STDESSUF' ];
  var props = parcel.properties;

  // handle house num
  var addressLow = cleanDorAttribute(props.HOUSE);
  var addressHigh = cleanDorAttribute(props.STEX);
  // maybe should be props.SUF below (it said props.SUFFIX)
  var addressSuffix = cleanDorAttribute(props.SUF);
  var address = addressLow;
  address = address + (addressHigh ? '-' + addressHigh : '');
  address = address + (addressSuffix || '');

  // handle unit
  var unit = cleanDorAttribute(props.UNIT);
  if (unit) {
    unit = '# ' + unit;
  }

  // clean up attributes
  var comps = STREET_FIELDS.map(function(streetField) {
    return props[streetField];
  });
  comps = comps.map(cleanDorAttribute);
  // TODO handle individual address comps (like mapping stex=2 => 1/2)
  // addressLow = comps.HOUSE,
  // addressHigh = comps.STEX,
  // streetPredir = comps.STDIR,
  // streetName = comps.STNAM,
  // streetSuffix = comps.STDES,
  // streetPostdir = comps.STDESSUF,

  // add address to front
  comps = [ address ].concat(comps);

  // add unit to end
  if (includeUnit) {
    comps = comps.concat([ unit ]);
  }

  // remove nulls and concat
  address = comps.filter(Boolean).join(' ');

  // if (import.meta.env.VITE_DEBUG == 'true') console.log('concatDorAddress address result:', address);
  if (address === '') {
    address = 'Parcel has no address';
  }
  if (import.meta.env.VITE_DEBUG == 'true') console.log('concatDorAddress address result:', address);
  return address;
}



export const useDorStore = defineStore("DorStore", {
  state: () => {
    return {
      dorDocuments: {},
      regmaps: {},
      dorCondos: {},
      loadingDorData: true,
    };
  },

  actions: {
    async clearAllDorData() {
      this.loadingDorData = true;
      this.dorDocuments = {};
      this.regmaps = {};
      this.dorCondos = {};
    },
    async fillDorCondos() {
      if (API_SOURCES.dorCondos === 'arcgis') {
        return this._fillDorCondosArcGIS();
      }
      if (API_SOURCES.dorCondos === 'databridge') {
        return this._fillDorCondosDatabridge();
      }
      return this._fillDorCondosCarto();
    },
    // per parcel: small regimes fetch whole; regimes over the databridge row cap
    // (Naval Square, 1,003 active units) get a remote entry that pages server-side
    async _fillDorCondosDatabridge() {
      this.dorCondos = {};
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillDorCondos (databridge) is running');
      const ParcelsStore = useParcelsStore();
      const parcels = ParcelsStore.dor.features;
      if (!parcels) return;
      for (const feature of parcels) {
        try {
          const baseSql = `select * from condominium where mapref = '${ feature.properties.mapreg }' and status in ('1','3')`;
          const countData = await fetchRowsWithFallback('dorCondos', buildCountSql(baseSql, ''));
          const total = countData && countData.rows && countData.rows.length ? Number(countData.rows[0].n) : null;

          if (total !== null && total > REMOTE_THRESHOLD) {
            this.dorCondos[feature.properties.objectid] = {
              remote: true,
              baseSql: baseSql,
              total: total,
              grandTotal: total,
              pages: {},
              search: '',
              sort: null,
              rows: [],
            };
            await this.fetchCondosServerPage(feature.properties.objectid, 0);
            continue;
          }

          const data = await fetchRowsWithFallback('dorCondos', baseSql);
          if (data) {
            this._decorateCondoRows(data.rows);
            this.dorCondos[feature.properties.objectid] = data;
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillDorCondos - query did not return rows');
          }
        } catch {
          if (import.meta.env.VITE_DEBUG == 'true') console.error('fillDorCondos - await never resolved, failed to fetch data');
        }
      }
    },
    _decorateCondoRows(rows) {
      for (let row of rows) {
        row.condo_parcel = row.recmap + '-' + row.condoparcel;
        row.unit_number = 'Unit #' + row.condounit;
      }
    },
    async fetchCondosServerPage(parcelId, pageIndex) {
      const entry = this.dorCondos[parcelId];
      if (!entry || !entry.remote || entry.pages[pageIndex]) {
        return;
      }
      const where = buildSearchWhere(entry.search, CONDOS_SEARCH_COLUMNS);
      // units read naturally in ascending order, unlike the date-led tables
      const orderBy = buildOrderBy(entry.sort || { field: 'unit_number', type: 'asc' }, CONDOS_SORT_COLUMNS, 'condounit');
      const data = await fetchRowsWithFallback('dorCondos', buildPageSql(entry.baseSql, where, orderBy, REMOTE_SERVER_PAGE, pageIndex));
      if (data && data.rows) {
        this._decorateCondoRows(data.rows);
        entry.pages[pageIndex] = data.rows;
      }
    },
    async condosUiPage(parcelId, uiPage, perPage) {
      const entry = this.dorCondos[parcelId];
      if (!entry || !entry.remote) {
        return [];
      }
      const firstRow = (uiPage - 1) * perPage;
      const serverPage = Math.floor(firstRow / REMOTE_SERVER_PAGE);
      await this.fetchCondosServerPage(parcelId, serverPage);
      if ((serverPage + 1) * REMOTE_SERVER_PAGE < entry.total) {
        this.fetchCondosServerPage(parcelId, serverPage + 1);
      }
      const pageRows = entry.pages[serverPage] || [];
      const start = firstRow - serverPage * REMOTE_SERVER_PAGE;
      return pageRows.slice(start, start + perPage);
    },
    async setCondosSearch(parcelId, term) {
      const entry = this.dorCondos[parcelId];
      if (!entry || !entry.remote) {
        return;
      }
      entry.search = term || '';
      entry.pages = {};
      const where = buildSearchWhere(entry.search, CONDOS_SEARCH_COLUMNS);
      const countData = await fetchRowsWithFallback('dorCondos', buildCountSql(entry.baseSql, where));
      if (countData && countData.rows && countData.rows.length) {
        entry.total = Number(countData.rows[0].n);
      }
      await this.fetchCondosServerPage(parcelId, 0);
    },
    async setCondosSort(parcelId, field, type) {
      const entry = this.dorCondos[parcelId];
      if (!entry || !entry.remote) {
        return;
      }
      entry.sort = { field: field, type: type };
      entry.pages = {};
      await this.fetchCondosServerPage(parcelId, 0);
    },
    _decorateDocRows(rows) {
      rows.forEach((doc) => {
        doc.date = date(doc.display_date);
        doc.link = `<a target='_blank' href='https://epayss.phila-records.com/web/web/integration/document?DocumentNumberId=${doc.document_id}'>${doc.document_id}<i class='fa fa-external-link'></i></a>`;
      });
    },
    async fetchDocsServerPage(parcelId, pageIndex) {
      const entry = this.dorDocuments[parcelId];
      if (!entry || !entry.remote || entry.pages[pageIndex]) {
        return;
      }
      const where = buildSearchWhere(entry.search, DOCS_SEARCH_COLUMNS);
      const orderBy = buildOrderBy(entry.sort, DOCS_SORT_COLUMNS, 'display_date');
      const data = await fetchRowsWithFallback('dorDocuments', buildPageSql(entry.baseSql, where, orderBy, REMOTE_SERVER_PAGE, pageIndex));
      if (data && data.rows) {
        this._decorateDocRows(data.rows);
        entry.pages[pageIndex] = data.rows;
      }
    },
    async docsUiPage(parcelId, uiPage, perPage) {
      const entry = this.dorDocuments[parcelId];
      if (!entry || !entry.remote) {
        return [];
      }
      const firstRow = (uiPage - 1) * perPage;
      const serverPage = Math.floor(firstRow / REMOTE_SERVER_PAGE);
      await this.fetchDocsServerPage(parcelId, serverPage);
      if ((serverPage + 1) * REMOTE_SERVER_PAGE < entry.total) {
        this.fetchDocsServerPage(parcelId, serverPage + 1);
      }
      const pageRows = entry.pages[serverPage] || [];
      const start = firstRow - serverPage * REMOTE_SERVER_PAGE;
      return pageRows.slice(start, start + perPage);
    },
    async setDocsSearch(parcelId, term) {
      const entry = this.dorDocuments[parcelId];
      if (!entry || !entry.remote) {
        return;
      }
      entry.search = term || '';
      entry.pages = {};
      const where = buildSearchWhere(entry.search, DOCS_SEARCH_COLUMNS);
      const countData = await fetchRowsWithFallback('dorDocuments', buildCountSql(entry.baseSql, where));
      if (countData && countData.rows && countData.rows.length) {
        entry.total = Number(countData.rows[0].n);
      }
      await this.fetchDocsServerPage(parcelId, 0);
    },
    async setDocsSort(parcelId, field, type) {
      const entry = this.dorDocuments[parcelId];
      if (!entry || !entry.remote) {
        return;
      }
      entry.sort = { field: field, type: type };
      entry.pages = {};
      await this.fetchDocsServerPage(parcelId, 0);
    },
    async _fillDorCondosArcGIS() {
      return new Promise((resolve) => {
        (async () => {
          this.dorCondos = {};
          if (import.meta.env.VITE_DEBUG == 'true') console.log('fillDorCondos (ArcGIS) is running');
          const ParcelsStore = useParcelsStore();
          const parcels = ParcelsStore.dor.features;
          if (!parcels) return resolve();
          const baseUrl = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Condominium/FeatureServer/0/query';
          for (const feature of parcels) {
            try {
              if (import.meta.env.VITE_DEBUG == 'true') console.log('feature:', feature);
              const whereClause = `mapref='${feature.properties.mapreg}' AND status IN (1,3)`;
              const params = new URLSearchParams({
                where: whereClause,
                outFields: '*',
                f: 'json',
              });
              const response = await fetch(`${baseUrl}?${params}`);
              if (response.ok) {
                const data = await response.json();
                if (import.meta.env.VITE_DEBUG == 'true') console.log('fillDorCondos data:', data);
                const rows = data.features ? data.features.map(f => f.attributes) : [];
                for (let row of rows) {
                  row.condo_parcel = row.recmap + '-' + row.condoparcel;
                  row.unit_number = 'Unit #' + row.condounit;
                }
                this.dorCondos[feature.properties.objectid] = { rows };
              } else {
                if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillDorCondos - await resolved but HTTP status was not successful');
              }
            } catch {
              if (import.meta.env.VITE_DEBUG == 'true') console.error('fillDorCondos - await never resolved, failed to fetch data');
            }
          }
          return resolve();
        })();
      });
    },
    async _fillDorCondosCarto() {
      return new Promise((resolve) => {
        (async () => {
          this.dorCondos = {};
          if (import.meta.env.VITE_DEBUG == 'true') console.log('fillDorCondos (Carto) is running');
          const ParcelsStore = useParcelsStore();
          const parcels = ParcelsStore.dor.features;
          if (!parcels) return resolve();
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          parcels.forEach(async(feature) => {
            try {
              if (import.meta.env.VITE_DEBUG == 'true') console.log('feature:', feature);
              const url = baseUrl + `select * from condominium where mapref = '${ feature.properties.mapreg }' and status in (1,3)`;
              const response = await fetch(url);
              if (response.ok) {
                const data = await response.json();
                if (import.meta.env.VITE_DEBUG == 'true') console.log('fillDorCondos data:', data);
                for (let row of data.rows) {
                  row.condo_parcel = row.recmap + '-' + row.condoparcel;
                  row.unit_number = 'Unit #' + row.condounit;
                }
                this.dorCondos[feature.properties.objectid] = data;
                return resolve();
              } else {
                if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillDorCondos - await resolved but HTTP status was not successful');
                return resolve();
              }
            } catch {
              if (import.meta.env.VITE_DEBUG == 'true') console.error('fillDorCondos - await never resolved, failed to fetch data');
              return resolve();
            }
          });
        })();
      });
    },
    async fillRegmaps() {
      return new Promise((resolve) => {
        (async () => {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('fillRegmaps is running');
          this.regmaps = {};
          const ParcelsStore = useParcelsStore();
          const parcels = ParcelsStore.dor.features;
          var xVals = [], yVals = [];

          // loop over parcels
          if (!parcels) return resolve();
          parcels.forEach(function (parcel) {
            var geom = parcel.geometry,
              parts = geom.coordinates;

            // loop over parts (whether it's simple or multipart)
            parts.forEach(function (coordPairs) {
              coordPairs.forEach(function (coordPair) {
                // if the polygon has a hole, it has another level of coord
                // pairs, presumably one for the outer coords and another for
                // inner. for simplicity, add them all.
                var hasHole = Array.isArray(coordPair[0]);

                if (hasHole) {
                  // loop through inner pairs
                  coordPair.forEach(function (innerCoordPair) {
                    var x = innerCoordPair[0],
                      y = innerCoordPair[1];

                    xVals.push(x);
                    yVals.push(y);
                  });
                // for all other polys
                } else {
                  var x = coordPair[0],
                    y = coordPair[1];

                  xVals.push(x);
                  yVals.push(y);
                }
              });
            });
          });

          // take max/min
          var xMin = Math.min.apply(null, xVals);
          var xMax = Math.max.apply(null, xVals);
          var yMin = Math.min.apply(null, yVals);
          var yMax = Math.max.apply(null, yVals);

          // make sure all coords are defined. no NaNs allowed.
          var coordsAreDefined = [ xMin, xMax, yMin, yMax ].every(
            function (coord) {
              return coord;
            },
          );

          // if they aren't
          if (!coordsAreDefined) {
            //  exit with null to avoid an error calling lat lng bounds constructor
            return null;
          }

          // construct geometry
          var bbox = [ xMin, yMin, xMax, yMax ];
          var bounds = bboxPolygon(bbox).geometry;

          if (import.meta.env.VITE_DEBUG == 'true') console.log('regmaps.js, bounds:', bounds);

          let url = '//services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/MASTERMAPINDEX/FeatureServer/0/query'; //+ [relationship](targetGeom);
          let params = {
            'returnGeometry': true,
            'where': '1=1',
            'outSR': 4326,
            'outFields': '*',
            'inSr': 4326,
            'geometryType': 'esriGeometryEnvelope',
            'spatialRel': 'esriSpatialRelIntersects',
            'f': 'geojson',
            'geometry': `{ "xmin": ${bounds.coordinates[0][0][0]}, "ymin": ${bounds.coordinates[0][0][1]}, "xmax": ${bounds.coordinates[0][2][0]}, "ymax": ${bounds.coordinates[0][2][1]}, "spatialReference": { "wkid":4326 }}`,
          };

          try {
            if (API_SOURCES.regmaps === 'databridge') {
              const data = await fetchDatabridgeGeoJSON(`select ${REGMAPS_DATABRIDGE_COLS}, ST_AsGeoJSON(ST_Transform(shape, 4326)) as geom from mastermapindex where ST_Intersects(shape, ST_Transform(ST_MakeEnvelope(${bounds.coordinates[0][0][0]}, ${bounds.coordinates[0][0][1]}, ${bounds.coordinates[0][2][0]}, ${bounds.coordinates[0][2][1]}, 4326), 2272))`);
              if (data) {
                // consumers read regmaps.data.features, mirroring the axios response wrapper
                this.regmaps = { data: data };
              } else {
                if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillRegmaps - databridge query did not return features');
              }
              return resolve();
            }
            const response = await axios.get(url, { params })
            if (response.status === 200) {
              this.regmaps = response;
              return resolve();
            } else {
              if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillRegmaps - await resolved but HTTP status was not successful');
              return resolve();
            }
          } catch {
            if (import.meta.env.VITE_DEBUG == 'true') console.error('fillRegmaps - await never resolved, failed to fetch data');
            return resolve();
          }
        })();
      });
    },
    async fillDorDocuments() {
      return new Promise((resolve) => {
        (async () => {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('fillDorDocuments is running');

          this.dorDocuments = {};
          const ParcelsStore = useParcelsStore();
          const GeocodeStore = useGeocodeStore();
          const url = `//services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/RTT_SUMMARY/FeatureServer/0/query`;
          
          const where = function(feature) {
            if (import.meta.env.VITE_DEBUG == 'true') console.log('where function is running, feature:', feature);
            // METHOD 1: via address
            var parcelBaseAddress = concatDorAddress(feature);
            var geocode = GeocodeStore.aisData.features[0].properties;
            var where;
          
            // REVIEW if the parcel has no address, we don't want to query
            // WHERE ADDRESS = 'null' (doesn't make sense), so use this for now
            if (!parcelBaseAddress || parcelBaseAddress === 'null'){
              where = "matched_regmap = '" + ParcelsStore.dor.features[0].properties.basereg + "'";
            } else {
              // TODO make these all camel case
              var props = GeocodeStore.aisData.features[0].properties,
                address_low = props.address_low,
                address_floor = Math.floor(address_low / 100, 1) * 100,
                address_remainder = address_low - address_floor,
                addressHigh = props.address_high,
                addressCeil = addressHigh || address_low;
          
              // form where clause
              where = "(((ADDRESS_LOW >= " + address_low + " AND ADDRESS_LOW <= " + addressCeil + ")"
                        + " OR (ADDRESS_LOW >= " + address_floor + " AND ADDRESS_LOW <= " + addressCeil + " AND ADDRESS_HIGH >= " + address_remainder + " ))"
                        + " AND STREET_NAME = '" + geocode.street_name
                        + "' AND STREET_SUFFIX = '" + geocode.street_suffix
                        + "' AND (MOD(ADDRESS_LOW,2) = MOD( " + address_low + ",2))";
          
          
          
              if (geocode.street_predir != '') {
                where += " AND STREET_PREDIR = '" + geocode.street_predir + "'";
              }
          
              if (geocode.address_low_suffix != '') {
                where += " AND ADDRESS_LOW_SUFFIX = '" + geocode.address_low_suffix + "'";
              }
          
              if (geocode.address_low_suffix == '') {
                where += " AND COALESCE(ADDRESS_LOW_SUFFIX, '') = ''";
                // where += " AND (ADDRESS_LOW_SUFFIX = '' OR ADDRESS_LOW_SUFFIX = null)";
              }
          
              // this is hardcoded right now to handle dor address suffixes that are actually fractions
              if (geocode.address_low_frac === '1/2') {
                where += " AND ADDRESS_LOW_SUFFIX = '2'"; //+ geocode.address_low_frac + "'";
              }
          
              if (geocode.street_postdir != '') {
                where += " AND STREET_POSTDIR = '" + geocode.street_postdir + "'";
              }
          
              // check for unit num
              var unitNum = cleanDorAttribute(feature.properties.UNIT),
                unitNum2 = geocode.unit_num;
              // if (import.meta.env.VITE_DEBUG == 'true') console.log('unitNum:', unitNum, 'unitNum2:', unitNum2);
          
              if (unitNum) {
                where += " AND unit_num = '" + unitNum + "'";
              } else if (unitNum2 !== '') {
                where += " AND unit_num = '" + unitNum2 + "'";
              }
              
              // where += ")";
              where += ") or matched_regmap = '" + ParcelsStore.dor.features[0].properties.basereg + "'";
              where += " or reg_map_id = '" + ParcelsStore.dor.features[0].properties.basereg + "'";
            }

            if (import.meta.env.VITE_DEBUG == 'true') console.log('address_low:', address_low, 'address_floor:', address_floor,
              'address_remainder:', address_remainder, 'addressHigh:', addressHigh,
              'addressCeil:', addressCeil, 'geocode.street_predir:', geocode.street_predir,
              'geocode.address_low_suffix:', geocode.address_low_suffix,
              'geocode.address_low_frac:', geocode.address_low_frac,
              'geocode.street_postdir:', geocode.street_postdir, 'unitNum:', unitNum,
              'unitNum2:', unitNum2, 'ParcelsStore.dor.features[0].properties.basereg:', ParcelsStore.dor.features[0].properties.basereg,
              'where:', where
            )
          
            return where;
          }

          if (!ParcelsStore.dor.features) {
            return resolve();
          }
          // if (import.meta.env.VITE_DEBUG == 'true') console.log('ParcelsStore.dor.features:', ParcelsStore.dor.features);
          for (let feature of ParcelsStore.dor.features) {
            // if (import.meta.env.VITE_DEBUG == 'true') console.log('in loop before try, feature:', feature);
            try {
              // if (import.meta.env.VITE_DEBUG == 'true') console.log('in loop in try, feature:', feature);
              let theWhere = where(feature);

              if (API_SOURCES.dorDocuments === 'databridge') {
                const baseSql = `select distinct ${DOCS_BASE_COLS} from rtt_summary where ${theWhere}`;
                const countData = await fetchRowsWithFallback('dorDocuments', buildCountSql(baseSql, ''));
                const total = countData && countData.rows && countData.rows.length ? Number(countData.rows[0].n) : null;

                if (total !== null && total > REMOTE_THRESHOLD) {
                  this.dorDocuments[feature.properties.objectid] = {
                    remote: true,
                    baseSql: baseSql,
                    total: total,
                    grandTotal: total,
                    pages: {},
                    search: '',
                    sort: null,
                    features: [],
                  };
                  await this.fetchDocsServerPage(feature.properties.objectid, 0);
                  continue;
                }

                const data = await fetchRowsWithFallback('dorDocuments', baseSql);
                if (data && data.rows) {
                  this._decorateDocRows(data.rows);
                  this.dorDocuments[feature.properties.objectid] = {
                    features: data.rows.map((row) => ({ attributes: row })),
                  };
                } else {
                  if (import.meta.env.VITE_DEBUG == 'true') console.warn('dorDocs - query did not return rows')
                }
                continue;
              }

              let response;
              if (API_SOURCES.dorDocuments === 'arcgis') {
                const params = {
                  where: theWhere,
                  // outFields: '*',
                  // outFields: "document_id, display_date, document_type, grantors, grantees, unit_num, matched_regmap, reg_map_id",
                  outFields: "document_id, display_date, document_type, grantors, grantees, unit_num",
                  returnDistinctValues: 'true',
                  returnGeometry: 'false',
                  f: 'json',
                  sqlFormat: 'standard',
                }
                // if (import.meta.env.VITE_DEBUG == 'true') console.log('params:', params);
                response = await axios(url, { params });
              } else {
                const sql = 'select distinct document_id, display_date, document_type, grantors, grantees, unit_num from rtt_summary where ' + theWhere;
                response = await axios('https://phl.carto.com/api/v2/sql', { params: { q: sql } });
              }
              if (response.status === 200) {
                // Carto returns rows; reshape to the ArcGIS features/attributes format the Deeds topic reads
                const data = response.data.rows
                  ? { features: response.data.rows.map((row) => ({ attributes: row })) }
                  : response.data;
                data.features.forEach((doc) => {
                  doc.attributes.date = date(doc.attributes.display_date);
                  doc.attributes.link = `<a target='_blank' href='https://epayss.phila-records.com/web/web/integration/document?DocumentNumberId=${doc.attributes.document_id}'>${doc.attributes.document_id}<i class='fa fa-external-link'></i></a>`;
                })
                this.dorDocuments[feature.properties.objectid] = data;
                // this.dorDocuments[feature.properties.objectid] = data;
                // return resolve();
              } else {
                if (import.meta.env.VITE_DEBUG == 'true') console.warn('dorDocs - await resolved but HTTP status was not successful')
                // return resolve();
              }
            } catch {
              if (import.meta.env.VITE_DEBUG == 'true') console.error('dorDocs - await never resolved, failed to fetch data')
              // return resolve();
            }
          }
        return resolve();
        })();
      });
    },
  }
})
