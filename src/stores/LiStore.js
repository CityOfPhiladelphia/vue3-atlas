import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { API_SOURCES } from '@/config/apiSources.js';

import useTransforms from '@/composables/useTransforms';
const { date } = useTransforms();
import axios from 'axios';

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
        const url = baseUrl += `SELECT * FROM building_cert_summary WHERE structure_id IN ('${bin}')`;
        const response = await fetch(url);
        if (response.ok) {
          this.liBuildingCertSummary = await response.json()
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('liBuildingCertSummary - await resolved but HTTP status was not successful')
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
        const url = baseUrl += `SELECT * FROM building_certs WHERE bin IN ('${bin}')`;
        const response = await fetch(url);
        if (response.ok) {
          let data = await response.json();
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
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
        const eclipse_location_id = feature.properties.eclipse_location_id.replace(/\|/g, "', '");
        const streetaddress = feature.properties.street_address;
        const opaQuery = feature.properties.opa_account_num ? ` OR opa_account_num IN ('${ feature.properties.opa_account_num}')` : ``;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key.replace(/\|/g, "', '");

        const url = baseUrl += `SELECT * FROM PERMITS WHERE address = '${ streetaddress }' or addressobjectid IN ('${ addressId }') \
        AND systemofrecord IN ('HANSEN') ${ opaQuery } \
        UNION SELECT * FROM PERMITS WHERE addressobjectid IN ('${ eclipse_location_id }') OR parcel_id_num IN ( '${ pwd_parcel_id }' ) \
        AND systemofrecord IN ('ECLIPSE')${ opaQuery }\
        ORDER BY permittype`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
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
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
        const url = baseUrl += `select * from ais_zoning_documents where doc_id = ANY('{ ${feature.properties.zoning_document_ids} }'::text[])`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
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
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
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
        const url = baseUrl += query;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
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
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
        const eclipse_location_id = feature.properties.eclipse_location_id.replace(/\|/g, "', '");
        const streetaddress = feature.properties.street_address;
        const opaQuery = feature.properties.opa_account_num ? ` OR opa_account_num IN ('${ feature.properties.opa_account_num}')` : ``;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key.replace(/\|/g, "', '");

        const url = baseUrl += `SELECT * FROM case_investigations WHERE (address = '${ streetaddress }' or addressobjectid IN ('${ addressId }')) \
            AND systemofrecord IN ('HANSEN') ${ opaQuery } UNION SELECT * FROM case_investigations WHERE \
            addressobjectid IN ('${ eclipse_location_id }') OR parcel_id_num IN ( '${ pwd_parcel_id }' ) \
            AND systemofrecord IN ('ECLIPSE') ${ opaQuery }`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
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

        const url = baseUrl += `SELECT * FROM VIOLATIONS WHERE ( address = '${ streetaddress }' \
          OR addressobjectid IN ('${ addressId }') \
          OR parcel_id_num IN ( '${ pwd_parcel_id }' ) ) \
          ${ opaQuery } \
          AND systemofrecord IN ('HANSEN') \
          UNION SELECT * FROM VIOLATIONS WHERE ( addressobjectid IN ('${ eclipse_location_id }') \
          OR parcel_id_num IN ( '${ pwd_parcel_id }' ) ) \
          ${ opaQuery } \
          AND systemofrecord IN ('ECLIPSE') \
          ORDER BY casenumber DESC`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
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
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
        const eclipse_location_id = feature.properties.eclipse_location_id.replace(/\|/g, "', '");
        const streetaddress = feature.properties.street_address;
        const opaQuery = feature.properties.opa_account_num ? ` OR opa_account_num IN ('${ feature.properties.opa_account_num}')` : '';
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key ? feature.properties.li_address_key.replace(/\|/g, "', '") : null;

        let query;
        if (eclipse_location_id) {
          query = `SELECT * FROM BUSINESS_LICENSES WHERE ( addressobjectid IN ('${eclipse_location_id}') AND addressed_license = 'Yes' \
          OR address = '${streetaddress}' AND addressed_license = 'Yes' \
          OR addressobjectid IN (${addressId}) AND addressed_license = 'Yes' \
          OR parcel_id_num IN ('${ pwd_parcel_id }') AND addressed_license = 'Yes' ) \
          ${opaQuery } \
          ORDER BY licensetype`;
        } else {
          query = `SELECT * FROM BUSINESS_LICENSES WHERE ( address = '${streetaddress}' AND addressed_license = 'Yes' \
          OR addressobjectid IN (${addressId}) AND addressed_license = 'Yes' \
          OR parcel_id_num IN ('${ pwd_parcel_id }') AND addressed_license = 'Yes' ) \
          ${opaQuery } \
          ORDER BY licensetype`;
        }
        const url = baseUrl += query;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
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

        const url = baseUrl += query;
        console.log('fillLiAppealsCarto fetching url:', url);
        const response = await fetch(url);
        console.log('fillLiAppealsCarto response.ok:', response.ok);
        if (response.ok) {
          const data = await response.json();
          console.log('fillLiAppealsCarto data.rows.length:', data.rows?.length);
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
        } else {
          this.loadingLiAppeals = false;
          console.warn('liAppeals - await resolved but HTTP status was not successful')
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
