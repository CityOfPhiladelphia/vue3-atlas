import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { API_SOURCES } from '@/config/apiSources.js';
import { fetchDatabridgeGeoJSON, fetchDatabridgeRows, fetchRowsWithFallback } from '@/util/databridge.js';
import { buildSearchWhere, buildOrderBy, buildCountSql, buildPageSql, REMOTE_THRESHOLD, REMOTE_SERVER_PAGE } from '@/util/remoteTable.js';

import useTransforms from '@/composables/useTransforms';
const { date } = useTransforms();
import axios from 'axios';

// databridge has no select *: shape must be transformed to 4326 explicitly, so columns are listed
const FOOTPRINTS_DATABRIDGE_COLS = 'bin, address, building_name, approx_hgt, max_hgt, base_elevation, square_ft, parcel_id_num, parcel_id_source, fcode, objectid';
// vue-good-table column field -> SQL column for server-side sorting
const PERMITS_SORT_COLUMNS = {
  permitissuedate: 'permitissuedate',
  link: 'permitnumber',
  permitdescription: 'permitdescription',
  status: 'status',
};
const PERMITS_SEARCH_COLUMNS = [ 'permitnumber', 'permitdescription', 'status' ];
const LICENSES_SORT_COLUMNS = {
  initialissuedate: 'initialissuedate',
  link: 'licensenum',
  business_name: 'business_name',
  licensetype: 'licensetype',
  licensestatus: 'licensestatus',
};
const LICENSES_SEARCH_COLUMNS = [ 'licensenum', 'business_name', 'licensetype', 'licensestatus' ];

// Helper to convert ArcGIS epoch timestamps to ISO date strings for table components
// Format: yyyy-MM-dd'T'HH:mm:ssZ (matches table dateInputFormat)
const epochToIso = (epoch) => {
  if (!epoch || typeof epoch !== 'number' || epoch <= 0) return null;
  const d = new Date(epoch);
  // Remove milliseconds from ISO string to match expected format
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

export const useLiStore = defineStore('LiStore', {
  state: () => {
    return {
      selectedLiBuildingNumber: null,
      liBuildingFootprints: {},
      loadingLiBuildingFootprints: false,
      liBuildingCertSummary: {},
      liBuildingCerts: {},
      loadingLiBuildingCerts: false,
      liPermits: {},
      loadingLiPermits: false,
      // remote-mode permits state: used when a parcel has more permits than
      // PERMITS_REMOTE_THRESHOLD - pages are fetched from the server on demand
      liPermitsRemote: false,
      liPermitsTotal: null,
      liPermitsGrandTotal: null,
      liPermitsPages: {},
      liPermitsSearch: '',
      liPermitsSort: null,
      liPermitsBaseSql: null,
      liLicensesRemote: false,
      liLicensesTotal: null,
      liLicensesGrandTotal: null,
      liLicensesPages: {},
      liLicensesSearch: '',
      liLicensesSort: null,
      liLicensesBaseSql: null,
      liAisZoningDocs: {},
      loadingLiAisZoningDocs: false,
      liEclipseZoningDocs: {},
      loadingLiEclipseZoningDocs: false,
      liInspections: {},
      loadingLiInspections: true,
      liViolations: {},
      loadingLiViolations: true,
      liBusinessLicenses: {},
      loadingLiBusinessLicenses: true,
      liAppeals: {},
      loadingLiAppeals: false,
      loadingLiData: true,
    };
  },
  // each of these functions was originally a single data-source file in atlas
  actions: {
    async fillAllLiData() {
      this.fillLiBuildingFootprints();
      this.fillLiBuildingCertSummary();
      this.fillLiBuildingCerts();
      this.fillLiInspections();
      this.fillLiAisZoningDocs();
      this.fillLiEclipseZoningDocs();
      this.fillLiPermits();
      this.fillLiViolations();
      this.fillLiBusinessLicenses();
      this.fillLiAppeals();
    },
    async clearAllLiData() {
      this.loadingLiData = true;
      this.selectedLiBuildingNumber = null;
      this.liBuildingFootprints = {};
      this.loadingLiBuildingFootprints = true;
      this.liBuildingCertSummary = {};
      this.liBuildingCerts = {};
      this.liPermits = {};
      this.loadingLiPermits = true;
      this.liPermitsRemote = false;
      this.liPermitsTotal = null;
      this.liPermitsGrandTotal = null;
      this.liPermitsPages = {};
      this.liPermitsSearch = '';
      this.liPermitsSort = null;
      this.liPermitsBaseSql = null;
      this.liLicensesRemote = false;
      this.liLicensesTotal = null;
      this.liLicensesGrandTotal = null;
      this.liLicensesPages = {};
      this.liLicensesSearch = '';
      this.liLicensesSort = null;
      this.liLicensesBaseSql = null;
      this.liAisZoningDocs = {};
      this.loadingLiAisZoningDocs = true;
      this.liEclipseZoningDocs = {};
      this.loadingLiEclipseZoningDocs = true;
      this.liInspections = {};
      this.loadingLiInspections = true;
      this.liViolations = {};
      this.loadingLiViolations = true;
      this.liBusinessLicenses = {};
      this.loadingLiBusinessLicenses = true;
      this.liAppeals = {};
      this.loadingLiAppeals = true;
    },
    async fillLiBuildingFootprints() {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('fillLiBuildingFootprints is running');
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0].properties.bin.split('|');
        const baseUrl = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/LI_BUILDING_FOOTPRINTS/FeatureServer/0/query';
        let data;
        let where;
        let bin = "";
        if (feature.length) {
          for (let i=0;i<feature.length;i++) {
            bin += feature[i];
            if (i < feature.length-1) {
              bin += "', '";
            }
          }
          where = "bin IN ('" + bin + "')";
          // if (import.meta.env.VITE_DEBUG == 'true') console.log('after loop, bin:', bin);
        } else {
          data = feature.properties.li_parcel_id;
          where = "parcel_id_num = '" + data + "'";
        }
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('where:', where);
        if (API_SOURCES.liBuildingFootprints === 'databridge') {
          const result = await fetchDatabridgeGeoJSON(`select ${FOOTPRINTS_DATABRIDGE_COLS}, ST_AsGeoJSON(ST_Transform(shape, 4326)) as geom from building_footprints_3857 where ${where}`);
          if (result) {
            // reshape to the ArcGIS pjson format LI.vue reads: attributes + geometry.rings
            this.liBuildingFootprints = {
              features: result.features.map((f) => ({
                attributes: f.properties,
                geometry: { rings: f.geometry ? (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.flat() : f.geometry.coordinates) : [] },
              })),
            };
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('liBuildingFootprints - databridge query did not return features')
          }
          this.loadingLiBuildingFootprints = false;
          return;
        }
        const params = {
          where: where,
          outFields: '*',
          outSR: 4326,
          f: 'pjson',
        };
        const response = await axios.get(baseUrl, { params });
        if (response.status === 200) {
          this.liBuildingFootprints = await response.data;
          this.loadingLiBuildingFootprints = false;
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('liBuildingFootprints - await resolved but HTTP status was not successful')
          this.loadingLiBuildingFootprints = false;
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liBuildingFootprints - await never resolved, failed to fetch address data')
        this.loadingLiBuildingFootprints = false;
      }
    },
    async fillLiBuildingCertSummary() {
      if (API_SOURCES.buildingCertSummary === 'arcgis') {
        return this._fillLiBuildingCertSummaryArcGIS();
      }
      return this._fillLiBuildingCertSummaryCarto();
    },
    async _fillLiBuildingCertSummaryArcGIS() {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('fillLiBuildingCertSummary is running');
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0].properties.bin.split('|');
        let bins = [];
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('li-building-cert-summary, feature:', feature);
        if (feature.length) {
          bins = feature;
          // if (import.meta.env.VITE_DEBUG == 'true') console.log('after loop, bins:', bins);
        } else if (this.liBuildingFootprints.data.features.length) {
          bins = [this.liBuildingFootprints.data.features[0].attributes.bin];
        }
        const whereClause = `structure_id IN ('${bins.join("','")}')`;
        const url = `https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/BUILDING_CERT_SUMMARY/FeatureServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&f=json`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          // Transform ArcGIS response format to match Carto format for compatibility
          this.liBuildingCertSummary = {
            rows: data.features ? data.features.map(f => f.attributes) : []
          };
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('liBuildingCertSummary - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liBuildingCertSummary - await never resolved, failed to fetch address data')
      }
    },
    async _fillLiBuildingCertSummaryCarto() {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('fillLiBuildingCertSummaryCarto is running');
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0].properties.bin.split('|');
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
        let bin = "";
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('li-building-cert-summary, feature:', feature);
        if (feature.length) {
          for (let i=0;i<feature.length;i++) {
            bin += feature[i];
            if (i < feature.length-1) {
              bin += "', '";
            }
          }
          // if (import.meta.env.VITE_DEBUG == 'true') console.log('after loop, bin:', bin);
        } else if (this.liBuildingFootprints.data.features.length) {
          bin = this.liBuildingFootprints.data.features[0].attributes.bin;//.replace(/\|/g, "', '");
        } else {
          bin = '';
        }
        const sql = `SELECT * FROM building_cert_summary WHERE structure_id IN ('${bin}')`;
        const data = await this._fetchLiSql('buildingCertSummary', sql);
        if (data) {
          this.liBuildingCertSummary = data;
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('liBuildingCertSummary - query did not return rows')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liBuildingCertSummary - await never resolved, failed to fetch address data')
      }
    },
    async fillLiBuildingCerts() {
      if (API_SOURCES.buildingCerts === 'arcgis') {
        return this._fillLiBuildingCertsArcGIS();
      }
      return this._fillLiBuildingCertsCarto();
    },
    async _fillLiBuildingCertsArcGIS() {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('fillLiBuildingCerts is running');
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0].properties.bin.split('|');
        let bins = [];
        if (feature.length) {
          bins = feature;
        } else if (this.liBuildingFootprints.data.features.length) {
          bins = [this.liBuildingFootprints.data.features[0].attributes.bin];
        }
        const whereClause = `bin IN ('${bins.join("','")}')`;
        const url = `https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/BUILDING_CERTS/FeatureServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&f=json`;
        const response = await fetch(url);
        if (response.ok) {
          const jsonData = await response.json();
          // Transform ArcGIS response format to match Carto format for compatibility
          let data = {
            rows: jsonData.features ? jsonData.features.map(f => f.attributes) : []
          };
          data.rows.forEach((item) => {
            item.link = `<a target='_blank' href='https://li.phila.gov/property-history/search/building-certification-detail?address="${encodeURIComponent(item.address)}"&Id=${item.bin}'>${item.buildingcerttype} <i class='fa fa-external-link'></i></a>`;
          })
          this.liBuildingCerts = data;
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('liBuildingCerts - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liBuildingCerts - await never resolved, failed to fetch address data')
      }
    },
    async _fillLiBuildingCertsCarto() {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('fillLiBuildingCertsCarto is running');
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0].properties.bin.split('|');
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
        let bin = "";
        if (feature.length) {
          for (let i=0;i<feature.length;i++) {
            bin += feature[i];
            if (i < feature.length-1) {
              bin += "', '";
            }
          }
        } else if (this.liBuildingFootprints.data.features.length) {
          bin = this.liBuildingFootprints.data.features[0].attributes.bin;//.replace(/\|/g, "', '");
        } else {
          bin = '';
        }
        const sql = `SELECT * FROM building_certs WHERE bin IN ('${bin}')`;
        let data;
        if (API_SOURCES.buildingCerts === 'databridge') {
          data = await fetchDatabridgeRows(sql);
          if (!data) {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('liBuildingCerts - databridge query did not return rows')
            return;
          }
        } else {
          const response = await fetch(baseUrl + sql);
          if (!response.ok) {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('liBuildingCerts - await resolved but HTTP status was not successful')
            return;
          }
          data = await response.json();
        }
        {
          data.rows.forEach((item) => {
            item.link = `<a target='_blank' href='https://li.phila.gov/property-history/search/building-certification-detail?address="${encodeURIComponent(item.address)}"&Id=${item.bin}'>${item.buildingcerttype} <i class='fa fa-external-link'></i></a>`;
          })
          this.liBuildingCerts = data;
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liBuildingCerts - await never resolved, failed to fetch address data')
      }
    },

    async fillLiPermits() {
      if (API_SOURCES.permits === 'arcgis') {
        return this._fillLiPermitsArcGIS();
      }
      return this._fillLiPermitsCarto();
    },
    async _fillLiPermitsArcGIS() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        const streetaddress = feature.properties.street_address;
        const opa_account_num = feature.properties.opa_account_num;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key ? feature.properties.li_address_key.replace(/\|/g, "','") : null;
        const eclipseLocationId = feature.properties.eclipse_location_id ? feature.properties.eclipse_location_id.replace(/\|/g, "','") : null;

        // Build WHERE conditions dynamically for ArcGIS
        const conditions = [];
        if (streetaddress) {
          conditions.push(`ADDRESS='${streetaddress}'`);
        }
        if (addressId) {
          conditions.push(`ADDRESSOBJECTID IN ('${addressId}')`);
        }
        if (pwd_parcel_id) {
          conditions.push(`PARCEL_ID_NUM IN ('${pwd_parcel_id}')`);
        }
        if (eclipseLocationId) {
          conditions.push(`ADDRESSOBJECTID IN ('${eclipseLocationId}')`);
        }
        if (opa_account_num) {
          conditions.push(`OPA_ACCOUNT_NUM IN ('${opa_account_num}')`);
        }

        const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=1';
        const url = `https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/PERMITS/FeatureServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&orderByFields=PERMITTYPE&f=json`;

        const response = await fetch(url);
        if (response.ok) {
          const jsonData = await response.json();
          // Transform ArcGIS response to match Carto format, lowercase field names
          const rows = jsonData.features ? jsonData.features.map(f => {
            const attrs = {};
            for (const key in f.attributes) {
              attrs[key.toLowerCase()] = f.attributes[key];
            }
            // Convert epoch timestamps to ISO strings for table component
            attrs.permitissuedate = epochToIso(attrs.permitissuedate);
            return attrs;
          }) : [];
          const data = { rows };
          data.rows.forEach((permit) => {
            permit.link = `<a target='_blank' href='https://li.phila.gov/Property-History/search/Permit-Detail?address="${encodeURIComponent(permit.address)}"&Id=${permit.permitnumber}'>${permit.permitnumber} <i class='fa fa-external-link'></i></a>`;
          });
          this.liPermits = data;
          this.loadingLiPermits = false;
        } else {
          this.loadingLiPermits = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('permits - await resolved but HTTP status was not successful')
        }
      } catch {
        this.loadingLiPermits = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('permits - await never resolved, failed to fetch address data')
      }
    },
    async _fillLiPermitsCarto() {
      try {
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('fillLiPermits is running');
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        const eclipse_location_id = feature.properties.eclipse_location_id.replace(/\|/g, "', '");
        const streetaddress = feature.properties.street_address;
        const opaQuery = feature.properties.opa_account_num ? ` OR opa_account_num IN ('${ feature.properties.opa_account_num}')` : ``;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key.replace(/\|/g, "', '");

        // the UNION query both modes count and page over; ORDER BY is applied per fetch
        this.liPermitsBaseSql = `SELECT * FROM PERMITS WHERE address = '${ streetaddress }' or addressobjectid IN ('${ addressId }') \
        AND systemofrecord IN ('HANSEN') ${ opaQuery } \
        UNION SELECT * FROM PERMITS WHERE addressobjectid IN ('${ eclipse_location_id }') OR parcel_id_num IN ( '${ pwd_parcel_id }' ) \
        AND systemofrecord IN ('ECLIPSE')${ opaQuery }`;

        const countData = await this._fetchLiSql('permits', buildCountSql(this.liPermitsBaseSql, ''));
        const total = countData && countData.rows && countData.rows.length ? Number(countData.rows[0].n) : null;
        this.liPermitsTotal = total;
        this.liPermitsGrandTotal = total;

        if (total !== null && total > REMOTE_THRESHOLD) {
          this.liPermitsRemote = true;
          this.liPermitsPages = {};
          this.liPermitsSearch = '';
          this.liPermitsSort = null;
          await this.fetchPermitsServerPage(0);
          this.loadingLiPermits = false;
          return;
        }

        this.liPermitsRemote = false;
        const data = await this._fetchLiSql('permits', `select * from (${this.liPermitsBaseSql}) permits_sub ORDER BY permittype`);
        if (!data) {
          this.loadingLiPermits = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('permits - query did not return rows')
          return;
        }
        this._decoratePermitRows(data.rows);
        this.liPermits = data;
        this.loadingLiPermits = false;
      } catch {
        this.loadingLiPermits = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('permits - await never resolved, failed to fetch address data')
      }
    },
    // transport for L&I SQL: databridge or direct carto, per the named apiSources switch.
    // A failed databridge call falls through to direct carto (loudly) so a proxy
    // hiccup degrades to the fallback instead of an empty topic - see bead vue3-atlas-h1v
    async _fetchLiSql(sourceKey, sql) {
      return fetchRowsWithFallback(sourceKey, sql);
    },
    _decoratePermitRows(rows) {
      rows.forEach((permit) => {
        permit.link = `<a target='_blank' href='https://li.phila.gov/Property-History/search/Permit-Detail?address="${encodeURIComponent(permit.address)}"&Id=${permit.permitnumber}'>${permit.permitnumber} <i class='fa fa-external-link'></i></a>`;
      });
    },
    async fetchPermitsServerPage(pageIndex) {
      if (this.liPermitsPages[pageIndex]) {
        return;
      }
      const where = buildSearchWhere(this.liPermitsSearch, PERMITS_SEARCH_COLUMNS);
      const orderBy = buildOrderBy(this.liPermitsSort, PERMITS_SORT_COLUMNS, 'permitissuedate');
      const data = await this._fetchLiSql('permits', buildPageSql(this.liPermitsBaseSql, where, orderBy, REMOTE_SERVER_PAGE, pageIndex));
      if (data && data.rows) {
        this._decoratePermitRows(data.rows);
        this.liPermitsPages[pageIndex] = data.rows;
      }
    },
    // serve one UI page from the buffer, fetching its server page if missing;
    // kicks off a background fetch of the next server page so boundary clicks don't wait
    async permitsUiPage(uiPage, perPage) {
      const firstRow = (uiPage - 1) * perPage;
      const serverPage = Math.floor(firstRow / REMOTE_SERVER_PAGE);
      await this.fetchPermitsServerPage(serverPage);
      if ((serverPage + 1) * REMOTE_SERVER_PAGE < this.liPermitsTotal) {
        this.fetchPermitsServerPage(serverPage + 1);
      }
      const pageRows = this.liPermitsPages[serverPage] || [];
      const start = firstRow - serverPage * REMOTE_SERVER_PAGE;
      return pageRows.slice(start, start + perPage);
    },
    async setPermitsSearch(term) {
      this.liPermitsSearch = term || '';
      this.liPermitsPages = {};
      // total must reflect the filter so the pagination is honest
      const where = buildSearchWhere(this.liPermitsSearch, PERMITS_SEARCH_COLUMNS);
      const countData = await this._fetchLiSql('permits', buildCountSql(this.liPermitsBaseSql, where));
      if (countData && countData.rows && countData.rows.length) {
        this.liPermitsTotal = Number(countData.rows[0].n);
      }
      await this.fetchPermitsServerPage(0);
    },
    async setPermitsSort(field, type) {
      this.liPermitsSort = { field: field, type: type };
      this.liPermitsPages = {};
      await this.fetchPermitsServerPage(0);
    },
    addDataToZoningDocs(data) {
      data.rows.forEach((item) => {
        if (item.issue_date) {
          item.doc_date = date(item.issue_date);
        } else if (item.scan_date) {
          item.doc_date = date(item.scan_date);
        } else {
          item.doc_date = 'N/A';
        }

        let appId;
        if (item.app_id) {
          appId = item.app_id;
          if (appId.length < 3) {
            appId = '0' + appId;
          }
        }
        let docId, url;
        if (item.doc_id) {
          docId = item.doc_id;
          url = '//s3.amazonaws.com/lni-zoning-pdfs/';
        } else if (item.permit_number ) {
          docId = item.permit_number ;
          url = 'http://s3.amazonaws.com/eclipse-docs-pdfs/zoning/';
        }
        item.link = '<a target="_blank" href="' //s3.amazonaws.com/lni-zoning-pdfs/'
                + url
                + docId
                + '.pdf">'
                + docId
                + ' <i class="fa fa-external-link"></i>'
                + '</a>';


        if (item.num_pages) {
          item.pages = item.num_pages;
        } else if (item.pages_scanned) {
          item.pages = item.page_scanned;
        } else {
          item.pages = 'N/A';
        }
      });
      return data;
    },
    async fillLiAisZoningDocs() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        const sql = `select * from ais_zoning_documents where doc_id = ANY('{ ${feature.properties.zoning_document_ids} }'::text[])`;
        const data = await this._fetchLiSql('aisZoningDocs', sql);
        if (data) {
          let addedData = this.addDataToZoningDocs(data);
          this.liAisZoningDocs = addedData;
          this.loadingLiAisZoningDocs = false;
        } else {
          this.loadingLiAisZoningDocs = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('aisZoningDocs - await resolved but HTTP status was not successful')
        }
      } catch {
        this.loadingLiAisZoningDocs = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('aisZoningDocs - await never resolved, failed to fetch address data')
      }
    },
    async fillLiEclipseZoningDocs() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        let query = null;
        if (feature.properties.eclipse_location_id === null || feature.properties.eclipse_location_id === '') {
          query = 'select * from li_zoning_docs where address_objectid in (' + null + ')';
        } else {
          const eclipseLocId = feature.properties.eclipse_location_id.split('|');
          let str = "'";
          let i;
          for (i = 0; i < eclipseLocId.length; i++) {
            str += eclipseLocId[i];
            str += "', '";
          }
          str = str.slice(0, str.length - 3);
          query = `select * from li_zoning_docs where address_objectid in (${ str })`;
        }
        const data = await this._fetchLiSql('eclipseZoningDocs', query);
        if (data) {
          let addedData = this.addDataToZoningDocs(data);
          this.liEclipseZoningDocs = addedData;
          this.loadingLiEclipseZoningDocs = false;
        } else {
          this.loadingLiEclipseZoningDocs = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('eclipseZoningDocs - await resolved but HTTP status was not successful')
        }
      } catch {
        this.loadingLiEclipseZoningDocs = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('eclipseZoningDocs - await never resolved, failed to fetch address data')
      }
    },

    async fillLiInspections() {
      if (API_SOURCES.inspections === 'arcgis') {
        return this._fillLiInspectionsArcGIS();
      }
      return this._fillLiInspectionsCarto();
    },
    async _fillLiInspectionsArcGIS() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        const streetaddress = feature.properties.street_address;
        const opa_account_num = feature.properties.opa_account_num;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key ? feature.properties.li_address_key.replace(/\|/g, "','") : null;
        const eclipseLocationId = feature.properties.eclipse_location_id ? feature.properties.eclipse_location_id.replace(/\|/g, "','") : null;

        // Build WHERE conditions dynamically for ArcGIS
        // Note: CASE_INVESTIGATIONS service uses lowercase field names (unlike other services)
        const conditions = [];
        if (streetaddress) {
          conditions.push(`address='${streetaddress}'`);
        }
        if (addressId) {
          conditions.push(`addressobjectid IN ('${addressId}')`);
        }
        if (pwd_parcel_id) {
          conditions.push(`parcel_id_num IN ('${pwd_parcel_id}')`);
        }
        if (eclipseLocationId) {
          conditions.push(`addressobjectid IN ('${eclipseLocationId}')`);
        }
        if (opa_account_num) {
          conditions.push(`opa_account_num IN ('${opa_account_num}')`);
        }

        const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=1';
        const url = `https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/CASE_INVESTIGATIONS/FeatureServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&f=json`;

        const response = await fetch(url);
        if (response.ok) {
          const jsonData = await response.json();
          const rows = jsonData.features ? jsonData.features.map(f => {
            const attrs = {};
            for (const key in f.attributes) {
              attrs[key.toLowerCase()] = f.attributes[key];
            }
            // Convert epoch timestamps to ISO strings
            attrs.investigationcompleted = epochToIso(attrs.investigationcompleted);
            return attrs;
          }) : [];
          const data = { rows };
          data.rows.forEach((item) => {
            let address = item.address;
            if (item.unit_num && item.unit_num != null) {
              address += ' Unit ' + item.unit_num;
            }
            item.link = "<a target='_blank' href='https://li.phila.gov/Property-History/search/Violation-Detail?address="+encodeURIComponent(address)+"&Id="+item.casenumber+"'>"+item.casenumber+" <i class='fa fa-external-link'></i></a>";

            let description;
            if (item.investigationtype) {
              description = item.investigationtype;
            } else if (item.caseresponsibility) {
              description = item.caseresponsibility;
            } else if (item.casetype) {
              description = item.casetype;
            }
            item.description = description;
          });
          this.liInspections = data;
          this.loadingLiInspections = false;
        } else {
          this.loadingLiInspections = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('liInspections - await resolved but HTTP status was not successful')
        }
      } catch {
        this.loadingLiInspections = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liInspections - await never resolved, failed to fetch address data')
      }
    },
    async _fillLiInspectionsCarto() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
        const eclipse_location_id = feature.properties.eclipse_location_id.replace(/\|/g, "', '");
        const streetaddress = feature.properties.street_address;
        const opaQuery = feature.properties.opa_account_num ? ` OR opa_account_num IN ('${ feature.properties.opa_account_num}')` : ``;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key.replace(/\|/g, "', '");

        const sql = `SELECT * FROM case_investigations WHERE (address = '${ streetaddress }' or addressobjectid IN ('${ addressId }')) \
            AND systemofrecord IN ('HANSEN') ${ opaQuery } UNION SELECT * FROM case_investigations WHERE \
            addressobjectid IN ('${ eclipse_location_id }') OR parcel_id_num IN ( '${ pwd_parcel_id }' ) \
            AND systemofrecord IN ('ECLIPSE') ${ opaQuery }`;

        let data;
        if (API_SOURCES.inspections === 'databridge') {
          data = await fetchDatabridgeRows(sql);
          if (!data) {
            this.loadingLiInspections = false;
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('liInspections - databridge query did not return rows')
            return;
          }
        } else {
          const response = await fetch(baseUrl + sql);
          if (!response.ok) {
            this.loadingLiInspections = false;
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('liInspections - await resolved but HTTP status was not successful')
            return;
          }
          data = await response.json();
        }
        {
          data.rows.forEach((item) => {
            let address = item.address;
            if (item.unit_num && item.unit_num != null) {
              address += ' Unit ' + item.unit_num;
            }
            item.link = "<a target='_blank' href='https://li.phila.gov/Property-History/search/Violation-Detail?address="+encodeURIComponent(address)+"&Id="+item.casenumber+"'>"+item.casenumber+" <i class='fa fa-external-link'></i></a>";

            let description;
            if (item.investigationtype) {
              description = item.investigationtype;
            } else if (item.caseresponsibility) {
              description = item.caseresponsibility;
            } else if (item.casetype) {
              description = item.casetype;
            }
            item.description = description;
          });
          this.liInspections = data;
          this.loadingLiInspections = false;
        }
      } catch {
        this.loadingLiInspections = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liInspections - await never resolved, failed to fetch address data')
      }
    },

    async fillLiViolations() {
      if (API_SOURCES.violations === 'arcgis') {
        return this._fillLiViolationsArcGIS();
      }
      return this._fillLiViolationsCarto();
    },
    async _fillLiViolationsArcGIS() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        const streetaddress = feature.properties.street_address;
        const opa_account_num = feature.properties.opa_account_num;
        const addressId = feature.properties.li_address_key;

        // Build WHERE clause for ArcGIS using correct uppercase field names
        let whereParts = [];
        if (opa_account_num) whereParts.push(`OPA_ACCOUNT_NUM='${opa_account_num}'`);
        if (streetaddress) whereParts.push(`ADDRESS='${streetaddress}'`);
        if (addressId) whereParts.push(`ADDRESSOBJECTID='${addressId}'`);
        const whereClause = whereParts.length > 0 ? whereParts.join(' OR ') : '1=1';
        // Use VIOLATIONS service (not LI_VIOLATIONS) - field names match Carto
        const url = `https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&orderByFields=CASENUMBER+DESC&f=json`;

        const response = await fetch(url);
        if (response.ok) {
          const jsonData = await response.json();
          // Transform ArcGIS response to match Carto format, lowercase field names
          const rows = jsonData.features ? jsonData.features.map(f => {
            const attrs = {};
            for (const key in f.attributes) {
              attrs[key.toLowerCase()] = f.attributes[key];
            }
            // Convert epoch timestamps to ISO strings for table component
            attrs.casecreateddate = epochToIso(attrs.casecreateddate);
            return attrs;
          }) : [];
          const data = { rows };
          data.rows.forEach((item) => {
            let address = item.address;
            if (item.unit_num && item.unit_num != null) {
              address += ' Unit ' + item.unit_num;
            }
            item.link = "<a target='_blank' href='https://li.phila.gov/Property-History/search/Violation-Detail?address="+encodeURIComponent(address)+"&Id="+item.casenumber+"'>"+item.casenumber+" <i class='fa fa-external-link'></i></a>";
            item.novLink = null;
            if (item.publicnov) {
              item.novLink = `<a target='_blank' href='${item.publicnov}'>${item.violationcodetitle} <i class='fa fa-external-link'></i></a>`
            } else {
              item.novLink = item.violationcodetitle;
            }
          });
          this.liViolations = data;
          this.loadingLiViolations = false;
        } else {
          this.loadingLiViolations = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('liViolations - await resolved but HTTP status was not successful')
        }
      } catch {
        this.loadingLiViolations = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liViolations - await never resolved, failed to fetch address data')
      }
    },
    async _fillLiViolationsCarto() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
        const eclipse_location_id = feature.properties.eclipse_location_id.replace(/\|/g, "', '");
        const streetaddress = feature.properties.street_address;
        const opaQuery = feature.properties.opa_account_num ? ` OR opa_account_num IN ('${ feature.properties.opa_account_num}')` : ``;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key.replace(/\|/g, "', '");

        const sql = `SELECT * FROM VIOLATIONS WHERE ( address = '${ streetaddress }' \
          OR addressobjectid IN ('${ addressId }') \
          OR parcel_id_num IN ( '${ pwd_parcel_id }' ) ) \
          ${ opaQuery } \
          AND systemofrecord IN ('HANSEN') \
          UNION SELECT * FROM VIOLATIONS WHERE ( addressobjectid IN ('${ eclipse_location_id }') \
          OR parcel_id_num IN ( '${ pwd_parcel_id }' ) ) \
          ${ opaQuery } \
          AND systemofrecord IN ('ECLIPSE') \
          ORDER BY casenumber DESC`;

        let data;
        if (API_SOURCES.violations === 'databridge') {
          data = await fetchDatabridgeRows(sql);
          if (!data) {
            this.loadingLiViolations = false;
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('liViolations - databridge query did not return rows')
            return;
          }
        } else {
          const response = await fetch(baseUrl + sql);
          if (!response.ok) {
            this.loadingLiViolations = false;
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('liViolations - await resolved but HTTP status was not successful')
            return;
          }
          data = await response.json();
        }
        {
          data.rows.forEach((item) => {
            let address = item.address;
            if (item.unit_num && item.unit_num != null) {
              address += ' Unit ' + item.unit_num;
            }
            item.link = "<a target='_blank' href='https://li.phila.gov/Property-History/search/Violation-Detail?address="+encodeURIComponent(address)+"&Id="+item.casenumber+"'>"+item.casenumber+" <i class='fa fa-external-link'></i></a>";
            item.novLink = null;
            if (item.publicnov) {
              item.novLink = `<a target='_blank' href='${item.publicnov}'>${item.violationcodetitle} <i class='fa fa-external-link'></i></a>`
            } else {
              item.novLink = item.violationcodetitle;
            }
          });
          this.liViolations = data;
          this.loadingLiViolations = false;
        }
      } catch {
        this.loadingLiViolations = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liViolations - await never resolved, failed to fetch address data')
      }
    },

    async fillLiBusinessLicenses() {
      if (API_SOURCES.businessLicenses === 'arcgis') {
        return this._fillLiBusinessLicensesArcGIS();
      }
      return this._fillLiBusinessLicensesCarto();
    },
    async _fillLiBusinessLicensesArcGIS() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        const streetaddress = feature.properties.street_address;
        const opa_account_num = feature.properties.opa_account_num;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key ? feature.properties.li_address_key.replace(/\|/g, "','") : null;
        const eclipseLocationId = feature.properties.eclipse_location_id ? feature.properties.eclipse_location_id.replace(/\|/g, "','") : null;

        // Build WHERE conditions dynamically for ArcGIS
        const conditions = [];
        if (streetaddress) {
          conditions.push(`ADDRESS='${streetaddress}'`);
        }
        if (addressId) {
          conditions.push(`ADDRESSOBJECTID IN ('${addressId}')`);
        }
        if (pwd_parcel_id) {
          conditions.push(`PARCEL_ID_NUM IN ('${pwd_parcel_id}')`);
        }
        if (eclipseLocationId) {
          conditions.push(`ADDRESSOBJECTID IN ('${eclipseLocationId}')`);
        }
        if (opa_account_num) {
          conditions.push(`OPA_ACCOUNT_NUM IN ('${opa_account_num}')`);
        }

        // Require addressed_license = 'Yes'
        const baseCondition = conditions.length > 0 ? `(${conditions.join(' OR ')})` : '1=1';
        const whereClause = `${baseCondition} AND ADDRESSED_LICENSE='Yes'`;
        const url = `https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/BUSINESS_LICENSES/FeatureServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&orderByFields=LICENSETYPE&f=json`;

        const response = await fetch(url);
        if (response.ok) {
          const jsonData = await response.json();
          // Transform ArcGIS response to match Carto format, lowercase field names
          const rows = jsonData.features ? jsonData.features.map(f => {
            const attrs = {};
            for (const key in f.attributes) {
              attrs[key.toLowerCase()] = f.attributes[key];
            }
            // Convert epoch timestamps to ISO strings for table component
            attrs.initialissuedate = epochToIso(attrs.initialissuedate);
            return attrs;
          }) : [];
          const data = { rows };
          data.rows.forEach((item) => {
            let address = item.address;
            if (item.unit_num && item.unit_num != null) {
              address += ' Unit ' + item.unit_num;
            }
            item.link = "<a target='_blank' href='https://li.phila.gov/Property-History/search/Business-License-Detail?address="+encodeURIComponent(address)+"&Id="+item.licensenum+"'>"+item.licensenum+" <i class='fa fa-external-link'></i></a>";
          });
          this.liBusinessLicenses = data;
          this.loadingLiBusinessLicenses = false;
        } else {
          this.loadingLiBusinessLicenses = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('liBusinessLicenses - await resolved but HTTP status was not successful')
        }
      } catch {
        this.loadingLiBusinessLicenses = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liBusinessLicenses - await never resolved, failed to fetch address data')
      }
    },
    async _fillLiBusinessLicensesCarto() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        const eclipse_location_id = feature.properties.eclipse_location_id.replace(/\|/g, "', '");
        const streetaddress = feature.properties.street_address;
        const opaQuery = feature.properties.opa_account_num ? ` OR opa_account_num IN ('${ feature.properties.opa_account_num}')` : '';
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key ? feature.properties.li_address_key.replace(/\|/g, "', '") : null;

        // the query both modes count and page over; ORDER BY is applied per fetch
        if (eclipse_location_id) {
          this.liLicensesBaseSql = `SELECT * FROM BUSINESS_LICENSES WHERE ( addressobjectid IN ('${eclipse_location_id}') AND addressed_license = 'Yes' \
          OR address = '${streetaddress}' AND addressed_license = 'Yes' \
          OR addressobjectid IN (${addressId}) AND addressed_license = 'Yes' \
          OR parcel_id_num IN ('${ pwd_parcel_id }') AND addressed_license = 'Yes' ) \
          ${opaQuery }`;
        } else {
          this.liLicensesBaseSql = `SELECT * FROM BUSINESS_LICENSES WHERE ( address = '${streetaddress}' AND addressed_license = 'Yes' \
          OR addressobjectid IN (${addressId}) AND addressed_license = 'Yes' \
          OR parcel_id_num IN ('${ pwd_parcel_id }') AND addressed_license = 'Yes' ) \
          ${opaQuery }`;
        }

        const countData = await this._fetchLiSql('businessLicenses', buildCountSql(this.liLicensesBaseSql, ''));
        const total = countData && countData.rows && countData.rows.length ? Number(countData.rows[0].n) : null;
        this.liLicensesTotal = total;
        this.liLicensesGrandTotal = total;

        if (total !== null && total > REMOTE_THRESHOLD) {
          this.liLicensesRemote = true;
          this.liLicensesPages = {};
          this.liLicensesSearch = '';
          this.liLicensesSort = null;
          await this.fetchLicensesServerPage(0);
          this.loadingLiBusinessLicenses = false;
          return;
        }

        this.liLicensesRemote = false;
        const data = await this._fetchLiSql('businessLicenses', `select * from (${this.liLicensesBaseSql}) licenses_sub ORDER BY licensetype`);
        if (!data) {
          this.loadingLiBusinessLicenses = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('liBusinessLicenses - query did not return rows')
          return;
        }
        this._decorateLicenseRows(data.rows);
        this.liBusinessLicenses = data;
        this.loadingLiBusinessLicenses = false;
      } catch {
        this.loadingLiBusinessLicenses = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('liBusinessLicenses - await never resolved, failed to fetch address data')
      }
    },
    _decorateLicenseRows(rows) {
      rows.forEach((item) => {
        let address = item.address;
        if (item.unit_num && item.unit_num != null) {
          address += ' Unit ' + item.unit_num;
        }
        item.link = "<a target='_blank' href='https://li.phila.gov/Property-History/search/Business-License-Detail?address="+encodeURIComponent(address)+"&Id="+item.licensenum+"'>"+item.licensenum+" <i class='fa fa-external-link'></i></a>";
      });
    },
    async fetchLicensesServerPage(pageIndex) {
      if (this.liLicensesPages[pageIndex]) {
        return;
      }
      const where = buildSearchWhere(this.liLicensesSearch, LICENSES_SEARCH_COLUMNS);
      const orderBy = buildOrderBy(this.liLicensesSort, LICENSES_SORT_COLUMNS, 'initialissuedate');
      const data = await this._fetchLiSql('businessLicenses', buildPageSql(this.liLicensesBaseSql, where, orderBy, REMOTE_SERVER_PAGE, pageIndex));
      if (data && data.rows) {
        this._decorateLicenseRows(data.rows);
        this.liLicensesPages[pageIndex] = data.rows;
      }
    },
    async licensesUiPage(uiPage, perPage) {
      const firstRow = (uiPage - 1) * perPage;
      const serverPage = Math.floor(firstRow / REMOTE_SERVER_PAGE);
      await this.fetchLicensesServerPage(serverPage);
      if ((serverPage + 1) * REMOTE_SERVER_PAGE < this.liLicensesTotal) {
        this.fetchLicensesServerPage(serverPage + 1);
      }
      const pageRows = this.liLicensesPages[serverPage] || [];
      const start = firstRow - serverPage * REMOTE_SERVER_PAGE;
      return pageRows.slice(start, start + perPage);
    },
    async setLicensesSearch(term) {
      this.liLicensesSearch = term || '';
      this.liLicensesPages = {};
      const where = buildSearchWhere(this.liLicensesSearch, LICENSES_SEARCH_COLUMNS);
      const countData = await this._fetchLiSql('businessLicenses', buildCountSql(this.liLicensesBaseSql, where));
      if (countData && countData.rows && countData.rows.length) {
        this.liLicensesTotal = Number(countData.rows[0].n);
      }
      await this.fetchLicensesServerPage(0);
    },
    async setLicensesSort(field, type) {
      this.liLicensesSort = { field: field, type: type };
      this.liLicensesPages = {};
      await this.fetchLicensesServerPage(0);
    },
    async fillLiAppeals() {
      if (API_SOURCES.appeals === 'arcgis') {
        return this._fillLiAppealsArcGIS();
      }
      return this._fillLiAppealsCarto();
    },
    async _fillLiAppealsArcGIS() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillLiAppeals is running');
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        const streetaddress = feature.properties.street_address;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key ? feature.properties.li_address_key.replace(/\|/g, "','") : null;
        const eclipseLocationId = feature.properties.eclipse_location_id ? feature.properties.eclipse_location_id.replace(/\|/g, "','") : null;
        const opaAccountNum = feature.properties.opa_account_num;

        // Build WHERE conditions dynamically for ArcGIS
        const conditions = [];
        if (streetaddress) {
          conditions.push(`ADDRESS='${streetaddress}'`);
        }
        if (addressId) {
          conditions.push(`ADDRESSOBJECTID IN ('${addressId}')`);
        }
        if (pwd_parcel_id) {
          conditions.push(`PARCEL_ID_NUM IN ('${pwd_parcel_id}')`);
        }
        if (eclipseLocationId) {
          conditions.push(`ADDRESSOBJECTID IN ('${eclipseLocationId}')`);
        }
        if (opaAccountNum) {
          conditions.push(`OPA_ACCOUNT_NUM IN ('${opaAccountNum}')`);
        }

        // Filter out ZBA appeals and require applicationtype
        const baseCondition = conditions.length > 0 ? `(${conditions.join(' OR ')})` : '1=1';
        const whereClause = `${baseCondition} AND APPLICATIONTYPE NOT IN ('Zoning Board of Adjustment', 'RB_ZBA') AND APPLICATIONTYPE IS NOT NULL`;
        const url = `https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/APPEALS/FeatureServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&orderByFields=APPEALTYPE&f=json`;

        console.log('fillLiAppeals fetching url:', url);
        const response = await fetch(url);
        console.log('fillLiAppeals response.ok:', response.ok);
        if (response.ok) {
          const jsonData = await response.json();
          // Transform ArcGIS response to match Carto format, lowercase field names
          const rows = jsonData.features ? jsonData.features.map(f => {
            const attrs = {};
            for (const key in f.attributes) {
              attrs[key.toLowerCase()] = f.attributes[key];
            }
            return attrs;
          }) : [];
          const data = { rows };
          console.log('fillLiAppeals data.rows.length:', data.rows?.length);
          data.rows.forEach((item) => {
            let address = item.address;
            if (item.unit_num && item.unit_num != null) {
              address += ' Unit ' + item.unit_num;
            }
            item.appeallink = "<a target='_blank' href='https://li.phila.gov/Property-History/search/appeal-detail?address="+encodeURIComponent(address)+"&Id="+item.appealnumber+"'>"+item.appealnumber+" <i class='fa fa-external-link'></i></a>";
            item.calendarlink = "<a target='_blank' href='https://li.phila.gov/appeals-calendar/appeal?from=2-7-2000&to=4-7-2050&region=all&Id="+item.appealnumber+"'>"+date(item.scheduleddate, 'MM/dd/yyyy')+" <i class='fa fa-external-link'></i></a>";
          });
          console.log('fillLiAppeals forEach completed, setting liAppeals');
          this.liAppeals = data;
          this.loadingLiAppeals = false;
        } else {
          this.loadingLiAppeals = false;
          console.warn('liAppeals - await resolved but HTTP status was not successful')
        }
      } catch (err) {
        this.loadingLiAppeals = false;
        console.error('liAppeals catch block error:', err)
      }
    },
    async _fillLiAppealsCarto() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillLiAppealsCarto is running');
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
        const streetaddress = feature.properties.street_address;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key ? feature.properties.li_address_key.replace(/\|/g, "', '") : null;
        const eclipseLocationId = feature.properties.eclipse_location_id ? feature.properties.eclipse_location_id.replace(/\|/g, "', '") : null;
        const opaAccountNum = feature.properties.opa_account_num;
        const liQuery = `applicationtype not in ('Zoning Board of Adjustment', 'RB_ZBA') and applicationtype is not null`;

        // Build WHERE conditions dynamically to avoid malformed SQL when values are missing
        const conditions = [];
        if (streetaddress) {
          conditions.push(`(address = '${streetaddress}' AND ${liQuery})`);
        }
        if (addressId) {
          conditions.push(`(addressobjectid IN ('${addressId}') AND ${liQuery})`);
        }
        if (pwd_parcel_id) {
          conditions.push(`(parcel_id_num IN ('${pwd_parcel_id}') AND ${liQuery})`);
        }
        if (eclipseLocationId) {
          conditions.push(`(addressobjectid IN ('${eclipseLocationId}') AND ${liQuery})`);
        }
        if (opaAccountNum) {
          conditions.push(`(opa_account_num IN ('${opaAccountNum}') AND ${liQuery})`);
        }

        let query = `SELECT * FROM APPEALS WHERE ${conditions.join(' OR ')} ORDER BY appealtype`;

        let data;
        if (API_SOURCES.appeals === 'databridge') {
          data = await fetchDatabridgeRows(query);
          if (!data) {
            this.loadingLiAppeals = false;
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('liAppeals - databridge query did not return rows')
            return;
          }
        } else {
          const url = baseUrl += query;
          console.log('fillLiAppealsCarto fetching url:', url);
          const response = await fetch(url);
          console.log('fillLiAppealsCarto response.ok:', response.ok);
          if (!response.ok) {
            this.loadingLiAppeals = false;
            console.warn('liAppeals - await resolved but HTTP status was not successful')
            return;
          }
          data = await response.json();
          console.log('fillLiAppealsCarto data.rows.length:', data.rows?.length);
        }
        {
          data.rows.forEach((item) => {
            let address = item.address;
            if (item.unit_num && item.unit_num != null) {
              address += ' Unit ' + item.unit_num;
            }
            item.appeallink = "<a target='_blank' href='https://li.phila.gov/Property-History/search/appeal-detail?address="+encodeURIComponent(address)+"&Id="+item.appealnumber+"'>"+item.appealnumber+" <i class='fa fa-external-link'></i></a>";
            item.calendarlink = "<a target='_blank' href='https://li.phila.gov/appeals-calendar/appeal?from=2-7-2000&to=4-7-2050&region=all&Id="+item.appealnumber+"'>"+date(item.scheduleddate, 'MM/dd/yyyy')+" <i class='fa fa-external-link'></i></a>";
          });
          console.log('fillLiAppealsCarto forEach completed, setting liAppeals');
          this.liAppeals = data;
          this.loadingLiAppeals = false;
        }
      } catch (err) {
        this.loadingLiAppeals = false;
        console.error('liAppeals catch block error:', err)
      }
    },
  },
  // keeping formatting getters here in the store only works if the data is not looped
  // through for a horizontal table
  getters: {

  }
})
